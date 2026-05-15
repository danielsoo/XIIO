import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { SignupProfile } from "@/types/user";

export async function saveUserProfile(
  uid: string,
  profile: SignupProfile,
  email: string | null
): Promise<void> {
  if (!db) throw new Error("Firebase가 설정되지 않았습니다.");

  await setDoc(doc(db, "users", uid), {
    displayName: profile.displayName,
    age: profile.age,
    isStudent: profile.isStudent,
    schoolName: profile.isStudent ? profile.schoolName ?? "" : null,
    platformPurpose: profile.platformPurpose,
    email,
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  });
}

export async function hasUserProfile(uid: string): Promise<boolean> {
  if (!db) return false;
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists();
}
