import type { Locale } from "@/i18n";
import type { ProfessionalField, ProfileRoleTag } from "@/types/portfolio";

export type PlatformPurpose = "watch" | "upload" | "both";

/** 가입·프로필 성별 */
export type UserGender = "male" | "female" | "undisclosed";

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

/** 표시 이름(displayName) 변경 신청 — 감독명과 동일 shape */
export type DisplayNameChangeRequest = DirectorNameChangeRequest;

/** @handle 변경 신청 */
export type HandleChangeRequest = DirectorNameChangeRequest;

export interface SignupProfile {
  displayName: string;
  locale: Locale;
  birthDate: string;
  gender: UserGender;
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
  gender?: UserGender | null;
  isStudent: boolean;
  schoolName?: string;
  platformPurpose: PlatformPurpose;
  email: string | null;
  emailVerified: boolean;
  role: UserRole;
  /** 업로더 기본 감독 표시명 (닉네임·본명 등) — 최초 1회 설정 후 직접 변경 불가 */
  defaultDirectorName?: string;
  directorNameChangeRequest?: DirectorNameChangeRequest;
  displayNameChangeRequest?: DisplayNameChangeRequest;
  handleChangeRequest?: HandleChangeRequest;
  /** 공개 프로필 사진 URL */
  avatarUrl?: string | null;
  /** 전문 프로필 @handle — /people/{handle} */
  handle?: string;
  headline?: string;
  bio?: string;
  /** @deprecated UI 미사용 — roleTags 사용 */
  primaryField?: ProfessionalField;
  roleTags?: ProfileRoleTag[];
  crewRoles?: string[];
  /** 태그·handle 검색 허용 */
  isDiscoverable?: boolean;
  /** 창구·프로필 협업 가능 */
  openToCollaborate?: boolean;
  collaborationNote?: string;
  followerCount?: number;
  followingCount?: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}
