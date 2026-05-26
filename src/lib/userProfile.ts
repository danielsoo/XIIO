import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { SignupProfile, UserProfileDoc, UserRole } from "@/types/user";
import { isAccountDeleted, parseUserProfileDoc } from "@/lib/userAccess";

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
    const profile = parseUserProfileDoc(snap.data() as Record<string, unknown>);
    if (isAccountDeleted(profile)) return null;
    return profile;
  } catch {
    return null;
  }
}

export async function hasUserProfile(uid: string): Promise<boolean> {
  if (!db) return false;
  try {
    const snap = await getDoc(doc(db, "users", uid));
    if (!snap.exists()) return false;
    const profile = parseUserProfileDoc(snap.data() as Record<string, unknown>);
    return !isAccountDeleted(profile);
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
    const existingDisplayName = existing.exists()
      ? String((existing.data() as Record<string, unknown>).displayName ?? "").trim()
      : "";
    await setDoc(
      ref,
      {
        ...(!existingDisplayName ? { displayName: profile.displayName } : {}),
        locale: profile.locale,
        birthDate: profile.birthDate,
        gender: profile.gender,
        age: null,
        isStudent: false,
        schoolName: null,
        platformPurpose: profile.platformPurpose,
        ...(profile.defaultDirectorName?.trim()
          ? {
              defaultDirectorName: profile.defaultDirectorName.trim().slice(0, 120),
            }
          : {}),
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
export async function markEmailVerified(uid: string): Promise<void> {
  if (!db) return;
  const ref = doc(db, "users", uid);
  await updateDoc(ref, {
    emailVerified: true,
    updatedAt: serverTimestamp(),
  });
}

/** 예전 가입(나이만 저장, birthDate·locale·gender 없음) */
export function isLegacyProfile(profile: UserProfileDoc): boolean {
  if (profile.birthDate?.trim()) return false;
  const age = profile.age;
  return age != null && age >= 13 && age <= 120;
}

export function isProfileComplete(profile: UserProfileDoc): boolean {
  if (!profile.displayName.trim()) return false;
  if (!profile.platformPurpose) return false;

  if (isLegacyProfile(profile)) return true;

  if (!profile.birthDate?.trim()) return false;
  if (!profile.locale) return false;
  if (!profile.gender) return false;
  return true;
}

export async function getPostAuthPath(uid: string): Promise<"/profiles" | "/signup"> {
  const profile = await getUserProfile(uid);
  if (!profile || !isProfileComplete(profile)) return "/signup";
  return "/profiles";
}
