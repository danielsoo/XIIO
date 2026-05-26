import {
  FieldValue,
  type CollectionReference,
  type DocumentReference,
  type Firestore,
} from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { deleteStreamVideo } from "@/lib/cloudflare/stream";
import { dmMessagesCol, dmThreadsCol } from "@/lib/server/dm";
import { followsCol, unfollowUser } from "@/lib/server/follows";
import { getAdminAuth, getFirebaseAdminApp } from "@/lib/server/firebase-admin";
import { handlesCol } from "@/lib/server/handles";
import {
  canOwnerDeleteWork,
  parsePromoDoc,
  parseWorkDoc,
  promoRef,
  worksCol,
} from "@/lib/server/works";
import { isAccountDeleted, parseUserProfileDoc } from "@/lib/userAccess";

const BATCH_LIMIT = 400;

export function isValidDeleteConfirmPhrase(phrase: string): boolean {
  const t = phrase.trim();
  return t === "탈퇴" || t === "DELETE";
}

export class DeleteAccountError extends Error {
  constructor(
    readonly code: string,
    readonly status: number,
    message: string
  ) {
    super(message);
  }
}

async function deleteCollectionDocs(db: Firestore, refs: DocumentReference[]): Promise<void> {
  for (let i = 0; i < refs.length; i += BATCH_LIMIT) {
    const batch = db.batch();
    for (const ref of refs.slice(i, i + BATCH_LIMIT)) {
      batch.delete(ref);
    }
    await batch.commit();
  }
}

async function listCollectionRefs(
  db: Firestore,
  path: CollectionReference
): Promise<DocumentReference[]> {
  const snap = await path.get();
  return snap.docs.map((d) => d.ref);
}

async function deleteUnpublishedWorks(db: Firestore, uid: string): Promise<void> {
  const snap = await worksCol(db, uid).get();
  for (const doc of snap.docs) {
    const work = parseWorkDoc(doc.id, doc.data() as Record<string, unknown>);
    if (!canOwnerDeleteWork(work.platformStatus)) continue;

    const promoSnap = await promoRef(db, uid, doc.id).get();
    if (promoSnap.exists) {
      const promo = parsePromoDoc(promoSnap.data() as Record<string, unknown>);
      if (promo.streamUid) {
        try {
          await deleteStreamVideo(promo.streamUid);
        } catch (e) {
          console.warn("[delete-account] promo stream:", e);
        }
      }
      await promoRef(db, uid, doc.id).delete();
    }

    if (work.streamUid) {
      try {
        await deleteStreamVideo(work.streamUid);
      } catch (e) {
        console.warn("[delete-account] work stream:", e);
      }
    }
    await doc.ref.delete();
  }
}

async function deleteUserSubcollections(db: Firestore, uid: string): Promise<void> {
  const userRef = db.collection("users").doc(uid);
  const subcols = ["watchProfiles", "portfolioShares", "blocks", "private", "creditIndex"] as const;
  for (const name of subcols) {
    const refs = await listCollectionRefs(db, userRef.collection(name));
    if (refs.length > 0) await deleteCollectionDocs(db, refs);
  }
}

async function deleteFollowRelationships(db: Firestore, uid: string): Promise<void> {
  const asFollower = await followsCol(db).where("followerUid", "==", uid).get();
  for (const doc of asFollower.docs) {
    const followingUid = String(doc.data().followingUid ?? "");
    if (followingUid) await unfollowUser(db, uid, followingUid);
  }

  const asFollowing = await followsCol(db).where("followingUid", "==", uid).get();
  for (const doc of asFollowing.docs) {
    const followerUid = String(doc.data().followerUid ?? "");
    if (followerUid) await unfollowUser(db, followerUid, uid);
  }
}

async function deleteAuthLinks(db: Firestore, uid: string): Promise<void> {
  const snap = await db.collection("authLinks").where("uid", "==", uid).get();
  if (snap.empty) return;
  await deleteCollectionDocs(
    db,
    snap.docs.map((d) => d.ref)
  );
}

async function deleteDmForUser(db: Firestore, uid: string): Promise<void> {
  const snap = await dmThreadsCol(db).where("participantIds", "array-contains", uid).get();
  for (const threadDoc of snap.docs) {
    const msgRefs = await listCollectionRefs(db, dmMessagesCol(db, threadDoc.id));
    if (msgRefs.length > 0) await deleteCollectionDocs(db, msgRefs);
    await threadDoc.ref.delete();
  }
}

async function deleteProfileStorage(uid: string): Promise<void> {
  const app = getFirebaseAdminApp();
  if (!app) return;
  try {
    const bucket = getStorage(app).bucket();
    await bucket.deleteFiles({ prefix: `users/${uid}/profile/` });
  } catch (e) {
    console.warn("[delete-account] storage profile:", e);
  }
}

async function anonymizeUserDoc(db: Firestore, uid: string, handle: string | undefined): Promise<void> {
  if (handle) {
    const handleRef = handlesCol(db).doc(handle);
    const handleSnap = await handleRef.get();
    if (handleSnap.exists && handleSnap.data()?.uid === uid) {
      await handleRef.delete();
    }
  }

  const userRef = db.collection("users").doc(uid);
  await userRef.set(
    {
      accountStatus: "deleted",
      deletedAt: FieldValue.serverTimestamp(),
      displayName: "",
      email: null,
      emailVerified: false,
      isDiscoverable: false,
      openToCollaborate: false,
      avatarUrl: null,
      bio: FieldValue.delete(),
      headline: FieldValue.delete(),
      collaborationNote: FieldValue.delete(),
      handle: FieldValue.delete(),
      birthDate: FieldValue.delete(),
      gender: FieldValue.delete(),
      age: FieldValue.delete(),
      schoolName: FieldValue.delete(),
      defaultDirectorName: FieldValue.delete(),
      roleTags: FieldValue.delete(),
      crewRoles: FieldValue.delete(),
      primaryField: FieldValue.delete(),
      directorNameChangeRequest: FieldValue.delete(),
      displayNameChangeRequest: FieldValue.delete(),
      handleChangeRequest: FieldValue.delete(),
      followerCount: 0,
      followingCount: 0,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

export type DeleteAccountResult =
  | { ok: true }
  | { ok: false; code: string; authDeleteFailed?: boolean };

export async function deleteUserAccount(db: Firestore, uid: string): Promise<DeleteAccountResult> {
  const userSnap = await db.collection("users").doc(uid).get();
  if (!userSnap.exists) {
    throw new DeleteAccountError("no_profile", 404, "프로필을 찾을 수 없습니다.");
  }

  const profile = parseUserProfileDoc(userSnap.data() as Record<string, unknown>);
  if (isAccountDeleted(profile)) {
    throw new DeleteAccountError("already_deleted", 409, "이미 탈퇴한 계정입니다.");
  }
  if (profile.role === "admin" || profile.role === "super_admin") {
    throw new DeleteAccountError(
      "admin_cannot_delete",
      403,
      "관리자 계정은 탈퇴할 수 없습니다."
    );
  }

  const handle = profile.handle?.trim().toLowerCase();

  await deleteUnpublishedWorks(db, uid);
  await deleteUserSubcollections(db, uid);
  await deleteFollowRelationships(db, uid);
  await deleteAuthLinks(db, uid);
  await deleteDmForUser(db, uid);

  try {
    await db.collection("billingVerifications").doc(uid).delete();
  } catch (e) {
    console.warn("[delete-account] billingVerifications:", e);
  }

  await deleteProfileStorage(uid);
  await anonymizeUserDoc(db, uid, handle);

  const adminAuth = getAdminAuth();
  if (!adminAuth) {
    return { ok: false, code: "auth_not_configured", authDeleteFailed: true };
  }

  try {
    await adminAuth.deleteUser(uid);
    return { ok: true };
  } catch (e) {
    console.error("[delete-account] deleteUser failed:", e);
    return { ok: false, code: "auth_delete_failed", authDeleteFailed: true };
  }
}
