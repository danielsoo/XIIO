export type PlatformPurpose = "watch" | "upload";

export type UserRole = "member" | "admin" | "super_admin";

export interface SignupProfile {
  displayName: string;
  age: number;
  isStudent: boolean;
  schoolName?: string;
  platformPurpose: PlatformPurpose;
}

/** Firestore `users/{uid}` — 회원 프로필·어드민 역할 */
export interface UserProfileDoc extends SignupProfile {
  email: string | null;
  emailVerified: boolean;
  role: UserRole;
  createdAt?: unknown;
  updatedAt?: unknown;
}
