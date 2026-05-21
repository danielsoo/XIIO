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
  /** 업로더 기본 감독 표시명 (닉네임·본명 등) */
  defaultDirectorName?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}
