import type { Firestore } from "firebase-admin/firestore";
import { getUidByHandle } from "@/lib/server/handles";
import { isAccountDeleted, parseUserProfileDoc } from "@/lib/userAccess";

export async function resolveDiscoverableProfileByHandle(db: Firestore, handle: string) {
  const uid = await getUidByHandle(db, handle);
  if (!uid) return null;

  const userSnap = await db.collection("users").doc(uid).get();
  if (!userSnap.exists) return null;

  const profile = parseUserProfileDoc(userSnap.data() as Record<string, unknown>);
  if (isAccountDeleted(profile)) return null;

  return { uid, profile, handle: profile.handle ?? handle };
}
