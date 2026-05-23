import type { Locale } from "@/i18n";

export type PlatformPurpose = "watch" | "upload" | "both";

export type UserRole = "member" | "admin" | "super_admin";

export type DirectorNameChangeRequestStatus = "pending" | "approved" | "rejected";

export type DirectorNameChangeRequest = {
  requestedName: string;
  reason?: string;
  status: DirectorNameChangeRequestStatus;
  requestedAt?: unknown;
  resolvedAt?: unknown;
  adminNote?: string;
};

export interface SignupProfile {
  displayName: string;
  locale: Locale;
  birthDate: string;
  platformPurpose: PlatformPurpose;
  defaultDirectorName?: string;
}

/** Firestore `users/{uid}` — 회원 프로필·어드민 역할 */
export interface UserProfileDoc {
  displayName: string;
  /** @deprecated 레거시 — 신규 가입은 birthDate 사용 */
  age?: number | null;
  locale?: Locale;
  birthDate?: string | null;
  isStudent: boolean;
  schoolName?: string;
  platformPurpose: PlatformPurpose;
  email: string | null;
  emailVerified: boolean;
  role: UserRole;
  /** 업로더 기본 감독 표시명 (닉네임·본명 등) — 최초 1회 설정 후 직접 변경 불가 */
  defaultDirectorName?: string;
  directorNameChangeRequest?: DirectorNameChangeRequest;
  createdAt?: unknown;
  updatedAt?: unknown;
}
