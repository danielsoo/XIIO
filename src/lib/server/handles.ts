import type { Firestore } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import { normalizeHandle } from "@/lib/server/credits";
import type { ProfessionalField } from "@/types/portfolio";
import { isProfessionalField } from "@/types/portfolio";
import { parseUserProfileDoc } from "@/lib/userAccess";

export { isProfessionalField };

export function handlesCol(db: Firestore) {
  return db.collection("handles");
}

export async function getUidByHandle(db: Firestore, handle: string): Promise<string | null> {
  const normalized = normalizeHandle(handle);
  if (!normalized) return null;
  const snap = await handlesCol(db).doc(normalized).get();
  if (!snap.exists) return null;
  const uid = snap.data()?.uid;
  return typeof uid === "string" ? uid : null;
}

export async function claimHandle(
  db: Firestore,
  uid: string,
  rawHandle: string,
  profileMerge?: Record<string, unknown>
): Promise<{ ok: true; handle: string } | { ok: false; code: string }> {
  const handle = normalizeHandle(rawHandle);
  if (!handle) return { ok: false, code: "handle_invalid" };

  const handleRef = handlesCol(db).doc(handle);
  const userRef = db.collection("users").doc(uid);

  try {
    await db.runTransaction(async (tx) => {
      const handleSnap = await tx.get(handleRef);
      if (handleSnap.exists && handleSnap.data()?.uid !== uid) {
        throw new Error("handle_taken");
      }
      const userSnap = await tx.get(userRef);
      const current = userSnap.exists
        ? String((userSnap.data() as Record<string, unknown>).handle ?? "")
        : "";
      if (current && current !== handle) {
        const oldRef = handlesCol(db).doc(current);
        const oldSnap = await tx.get(oldRef);
        if (oldSnap.exists && oldSnap.data()?.uid === uid) {
          tx.delete(oldRef);
        }
      }
      tx.set(handleRef, { uid, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
      tx.set(
        userRef,
        {
          handle,
          isDiscoverable: true,
          updatedAt: FieldValue.serverTimestamp(),
          ...profileMerge,
        },
        { merge: true }
      );
    });
    return { ok: true, handle };
  } catch (e) {
    if (e instanceof Error && e.message === "handle_taken") {
      return { ok: false, code: "handle_taken" };
    }
    throw e;
  }
}

export async function searchUsersByHandlePrefix(
  db: Firestore,
  query: string,
  limit = 10
): Promise<
  { uid: string; handle: string; displayName: string; defaultDirectorName: string | null }[]
> {
  const prefix = query.trim().toLowerCase().replace(/^@/, "");
  if (
    prefix.length < 2 ||
    prefix.length > 30 ||
    !/^[a-z0-9_.]+$/.test(prefix) ||
    prefix.startsWith(".") ||
    prefix.includes("..")
  ) {
    return [];
  }

  const { FieldPath } = await import("firebase-admin/firestore");
  const snap = await handlesCol(db)
    .orderBy(FieldPath.documentId())
    .startAt(prefix)
    .endAt(`${prefix}\uf8ff`)
    .limit(Math.min(limit, 20))
    .get();

  const results: {
    uid: string;
    handle: string;
    displayName: string;
    defaultDirectorName: string | null;
  }[] = [];
  for (const doc of snap.docs) {
    const uid = String(doc.data().uid ?? "");
    if (!uid) continue;
    const userSnap = await db.collection("users").doc(uid).get();
    if (!userSnap.exists) continue;
    const data = userSnap.data() as Record<string, unknown>;
    const profile = parseUserProfileDoc(data);
    if (profile.isDiscoverable === false) continue;
    const defaultDirectorName = profile.defaultDirectorName ?? null;
    results.push({
      uid,
      handle: doc.id,
      displayName: profile.displayName || doc.id,
      defaultDirectorName,
    });
  }
  return results;
}

export type CreditMemberSearchResult = {
  uid: string;
  handle: string;
  displayName: string;
  defaultDirectorName: string | null;
};

const EMAIL_SEARCH_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * 크레딧 회원 검색: 이름은 정확히 일치할 때만, 활동명/@handle은 prefix로 찾는다.
 * 이메일 형태의 입력은 검색하지 않으며 결과에도 이메일을 포함하지 않는다.
 */
export async function searchUsersForCredits(
  db: Firestore,
  rawQuery: string,
  limit = 10
): Promise<CreditMemberSearchResult[]> {
  const query = rawQuery.trim();
  if (query.length < 2) return [];
  const max = Math.min(Math.max(limit, 1), 20);
  const results = new Map<string, CreditMemberSearchResult>();

  const addUser = (uid: string, data: Record<string, unknown>) => {
    if (results.size >= max) return;
    const profile = parseUserProfileDoc(data);
    const handle = profile.handle?.trim();
    if (!handle || profile.isDiscoverable === false) return;
    results.set(uid, {
      uid,
      handle,
      displayName: profile.displayName,
      defaultDirectorName: profile.defaultDirectorName ?? null,
    });
  };

  if (EMAIL_SEARCH_REGEX.test(query.toLowerCase())) return [];

  const exactNameVariants = new Set([
    query,
    query.toLocaleLowerCase(),
    query.toLocaleUpperCase(),
    query
      .split(/\s+/)
      .map((part) => part.charAt(0).toLocaleUpperCase() + part.slice(1).toLocaleLowerCase())
      .join(" "),
  ]);
  const nameSnaps = await Promise.all(
    [...exactNameVariants].map((name) =>
      db.collection("users").where("displayName", "==", name).limit(max).get()
    )
  );
  for (const snap of nameSnaps) {
    for (const doc of snap.docs) addUser(doc.id, doc.data() as Record<string, unknown>);
  }

  const handleQuery = query.replace(/^@/, "");
  const isHandlePrefix = /^[a-zA-Z0-9_.]{2,30}$/.test(handleQuery);
  if (isHandlePrefix) {
    const handleHits = await searchUsersByHandlePrefix(db, handleQuery, max);
    for (const hit of handleHits) {
      const userSnap = await db.collection("users").doc(hit.uid).get();
      if (userSnap.exists) addUser(hit.uid, userSnap.data() as Record<string, unknown>);
    }

    if (results.size < max) {
      const legacyHandlePrefix = handleQuery.toLocaleLowerCase();
      const legacyHandleSnap = await db
        .collection("users")
        .orderBy("handle")
        .startAt(legacyHandlePrefix)
        .endAt(`${legacyHandlePrefix}\uf8ff`)
        .limit(max)
        .get();
      for (const doc of legacyHandleSnap.docs) {
        addUser(doc.id, doc.data() as Record<string, unknown>);
      }
    }
  }

  if (!query.startsWith("@") && results.size < max) {
    const variants = new Set([
      query,
      query.toLocaleLowerCase(),
      query.charAt(0).toLocaleUpperCase() + query.slice(1).toLocaleLowerCase(),
    ]);
    const stageSnaps = await Promise.all(
      [...variants].map((prefix) =>
        db
          .collection("users")
          .orderBy("defaultDirectorName")
          .startAt(prefix)
          .endAt(`${prefix}\uf8ff`)
          .limit(max)
          .get()
      )
    );
    for (const snap of stageSnaps) {
      for (const doc of snap.docs) {
        if (results.size >= max) break;
        addUser(doc.id, doc.data() as Record<string, unknown>);
      }
    }
  }

  return [...results.values()];
}
