import { FieldValue, type Firestore, type Timestamp } from "firebase-admin/firestore";

import type { ProfilePost } from "@/types/profilePost";

export type ProfilePostDoc = ProfilePost;

export function profilePostsCol(db: Firestore, uid: string) {
  return db.collection("users").doc(uid).collection("profilePosts");
}

function timestampToIso(value: unknown): string | null {
  if (value && typeof value === "object" && "toDate" in value) {
    try {
      return (value as Timestamp).toDate().toISOString();
    } catch {
      return null;
    }
  }
  return null;
}

export function parseProfilePostDoc(id: string, data: Record<string, unknown>): ProfilePostDoc | null {
  const text = typeof data.text === "string" ? data.text.trim() : "";
  if (!text) return null;
  const authorUid = typeof data.authorUid === "string" ? data.authorUid : "";
  if (!authorUid) return null;
  return {
    id,
    text,
    authorUid,
    createdAt: timestampToIso(data.createdAt),
    updatedAt: timestampToIso(data.updatedAt),
  };
}

export async function listProfilePosts(db: Firestore, uid: string, limit = 48): Promise<ProfilePostDoc[]> {
  const snap = await profilePostsCol(db, uid).orderBy("createdAt", "desc").limit(limit).get();
  const posts: ProfilePostDoc[] = [];
  for (const doc of snap.docs) {
    const parsed = parseProfilePostDoc(doc.id, doc.data() as Record<string, unknown>);
    if (parsed) posts.push(parsed);
  }
  return posts;
}

export async function createProfilePost(
  db: Firestore,
  uid: string,
  text: string
): Promise<ProfilePostDoc> {
  const trimmed = text.trim();
  if (!trimmed) throw new Error("empty_text");
  const ref = profilePostsCol(db, uid).doc();
  await ref.set({
    text: trimmed.slice(0, 4000),
    authorUid: uid,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  const snap = await ref.get();
  const parsed = parseProfilePostDoc(ref.id, snap.data() as Record<string, unknown>);
  if (!parsed) throw new Error("create_failed");
  return parsed;
}

export async function updateProfilePost(
  db: Firestore,
  uid: string,
  postId: string,
  text: string
): Promise<ProfilePostDoc | null> {
  const trimmed = text.trim();
  if (!trimmed) throw new Error("empty_text");
  const ref = profilePostsCol(db, uid).doc(postId);
  const snap = await ref.get();
  if (!snap.exists) return null;
  await ref.update({
    text: trimmed.slice(0, 4000),
    updatedAt: FieldValue.serverTimestamp(),
  });
  const updated = await ref.get();
  return parseProfilePostDoc(postId, updated.data() as Record<string, unknown>);
}

export async function deleteProfilePost(
  db: Firestore,
  uid: string,
  postId: string
): Promise<boolean> {
  const ref = profilePostsCol(db, uid).doc(postId);
  const snap = await ref.get();
  if (!snap.exists) return false;
  await ref.delete();
  return true;
}
