import { FieldValue, type Firestore } from "firebase-admin/firestore";

export function blocksCol(db: Firestore, uid: string) {
  return db.collection("users").doc(uid).collection("blocks");
}

export async function isBlocked(
  db: Firestore,
  uid: string,
  otherUid: string
): Promise<boolean> {
  const [a, b] = await Promise.all([
    blocksCol(db, uid).doc(otherUid).get(),
    blocksCol(db, otherUid).doc(uid).get(),
  ]);
  return a.exists || b.exists;
}

export async function blockUser(db: Firestore, uid: string, blockedUid: string): Promise<void> {
  if (uid === blockedUid) return;
  await blocksCol(db, uid).doc(blockedUid).set({
    blockedUid,
    createdAt: FieldValue.serverTimestamp(),
  });
}

export async function unblockUser(db: Firestore, uid: string, blockedUid: string): Promise<void> {
  await blocksCol(db, uid).doc(blockedUid).delete();
}
