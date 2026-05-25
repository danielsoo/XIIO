import type { Firestore } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import { normalizeHandle } from "@/lib/server/credits";
import type { ProfessionalField } from "@/types/portfolio";
import { PROFESSIONAL_FIELDS } from "@/types/portfolio";

export function handlesCol(db: Firestore) {
  return db.collection("handles");
}

export function isProfessionalField(v: string): v is ProfessionalField {
  return (PROFESSIONAL_FIELDS as readonly string[]).includes(v);
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
): Promise<{ uid: string; handle: string; displayName: string }[]> {
  const prefix = normalizeHandle(query);
  if (!prefix || prefix.length < 2) return [];

  const { FieldPath } = await import("firebase-admin/firestore");
  const snap = await handlesCol(db)
    .orderBy(FieldPath.documentId())
    .startAt(prefix)
    .endAt(`${prefix}\uf8ff`)
    .limit(Math.min(limit, 20))
    .get();

  const results: { uid: string; handle: string; displayName: string }[] = [];
  for (const doc of snap.docs) {
    const uid = String(doc.data().uid ?? "");
    if (!uid) continue;
    const userSnap = await db.collection("users").doc(uid).get();
    if (!userSnap.exists) continue;
    const data = userSnap.data() as Record<string, unknown>;
    if (data.isDiscoverable === false) continue;
    results.push({
      uid,
      handle: doc.id,
      displayName: String(data.displayName ?? doc.id),
    });
  }
  return results;
}
