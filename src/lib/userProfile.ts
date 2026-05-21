import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { SignupProfile, UserProfileDoc, UserRole } from "@/types/user";
import { parseUserProfileDoc } from "@/lib/userAccess";

export const FIRESTORE_PERMISSION_DENIED = "FIRESTORE_PERMISSION_DENIED";

function mapFirestoreError(err: unknown): Error {
  const code = (err as { code?: string })?.code;
  if (code === "permission-denied") {
    const e = new Error(FIRESTORE_PERMISSION_DENIED);
    Object.assign(e, { code: "permission-denied" });
    return e;
  }
  if (err instanceof Error) return err;
  return new Error("프로필 저장에 실패했습니다.");
}

export async function getUserProfile(uid: string): Promise<UserProfileDoc | null> {
  if (!db) return null;
  try {
    const snap = await getDoc(doc(db, "users", uid));
    if (!snap.exists()) return null;
    return parseUserProfileDoc(snap.data() as Record<string, unknown>);
  } catch {
    return null;
  }
}

export async function hasUserProfile(uid: string): Promise<boolean> {
  if (!db) return false;
  try {
    const snap = await getDoc(doc(db, "users", uid));
    return snap.exists();
  } catch {
    return false;
  }
}

export async function saveUserProfile(
  uid: string,
  profile: SignupProfile,
  email: string | null,
  options?: { emailVerified?: boolean; role?: UserRole }
): Promise<void> {
  if (!db) throw new Error("Firebase가 설정되지 않았습니다.");

  const ref = doc(db, "users", uid);
  const role = options?.role ?? "member";
  const emailVerified = options?.emailVerified ?? false;

  try {
    const existing = await getDoc(ref);
    await setDoc(
      ref,
      {
        displayName: profile.displayName,
        age: profile.age ?? null,
        isStudent: false,
        schoolName: null,
        platformPurpose: profile.platformPurpose,
        email: email?.toLowerCase() ?? null,
        emailVerified,
        role,
        updatedAt: serverTimestamp(),
        ...(existing.exists() ? {} : { createdAt: serverTimestamp() }),
      },
      { merge: true }
    );
  } catch (err) {
    throw mapFirestoreError(err);
  }
}

/** Google 로그인 직후 최소 프로필 */
export async function createGoogleMemberProfile(
  uid: string,
  email: string | null,
  displayName: string | null
): Promise<void> {
  await saveUserProfile(
    uid,
    {
      displayName: displayName?.trim() || email?.split("@")[0] || "User",
      platformPurpose: "watch",
    },
    email,
    { emailVerified: true, role: "member" }
  );
}

export async function markEmailVerified(uid: string): Promise<void> {
  if (!db) return;
  const ref = doc(db, "users", uid);
  await updateDoc(ref, {
    emailVerified: true,
    updatedAt: serverTimestamp(),
  });
}

export function isProfileComplete(profile: UserProfileDoc): boolean {
  if (!profile.displayName.trim()) return false;
  if (!profile.platformPurpose) return false;
  return true;
}

export async function getPostAuthPath(uid: string): Promise<"/profiles" | "/signup"> {
  const profile = await getUserProfile(uid);
  if (!profile || !isProfileComplete(profile)) return "/signup";
  return "/profiles";
}
