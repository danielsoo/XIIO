import type {
  ReportReasonCode,
  ReportStatus,
  ReportTargetType,
} from "@/types/report";

export type OnboardingStatsPayload = {
  total: number;
  watch: number;
  upload: number;
  both: number;
  other: number;
  signupsByDay: Record<string, number>;
};

import type { Locale } from "@/i18n";
import type { UserGender } from "@/types/user";
import type { DirectorNameChangeRequest, PlatformPurpose, UserRole } from "@/types/user";
import type { PlatformStatus, PromoPlatformStatus, StreamStatus, WorkDoc, WorkSection } from "@/types/work";

export type AdminUserWorkSummary = {
  id: string;
  title: string;
  section: WorkSection;
  platformStatus: PlatformStatus;
  streamStatus: StreamStatus;
  proposedCategory?: string;
  approvedCategory?: string;
  createdAt?: unknown;
};

export type AdminReportListItem = {
  id: string;
  targetType: ReportTargetType;
  targetOwnerUid: string;
  targetWorkId: string;
  targetTitle: string;
  reporterUid: string;
  reporterName: string;
  reporterEmail: string | null;
  reasonCode: ReportReasonCode;
  reasonDetail?: string;
  status: ReportStatus;
  createdAt?: unknown;
  resolvedAt?: unknown;
  adminNote?: string;
  playbackUrl?: string;
};

export type AdminReportsListResponse = {
  items: AdminReportListItem[];
  nextCursor: string | null;
};

export type AdminUserListItem = {
  uid: string;
  displayName: string;
  email: string | null;
  platformPurpose: PlatformPurpose;
  role: UserRole;
  emailVerified: boolean;
  createdAt?: unknown;
};

export type AdminUsersListResponse = {
  items: AdminUserListItem[];
  nextCursor: string | null;
};

export type AdminPaymentEventListItem = {
  id: string;
  uid: string;
  displayName: string;
  email: string | null;
  provider: string;
  amountMinor: number | null;
  currency: string | null;
  processedAt?: unknown;
  depositVerified: boolean;
};

export type AdminPaymentEventsListResponse = {
  items: AdminPaymentEventListItem[];
  nextCursor: string | null;
  meta: {
    depositEnabled: boolean;
    providers: string[];
  };
};

export const ADMIN_USER_ACTIVITY_KINDS = [
  "account_joined",
  "deposit_payment",
  "report_filed",
  "report_received",
  "report_resolved",
  "work_created",
  "work_deletion_requested",
  "work_revision_submitted",
  "work_published",
  "work_reviewed",
  "promo_created",
  "promo_submitted",
  "promo_published",
  "promo_revision_submitted",
  "promo_deletion_requested",
  "promo_like",
  "watch_profile_created",
  "admin_audit",
] as const;

export type AdminUserActivityKind = (typeof ADMIN_USER_ACTIVITY_KINDS)[number];

export type AdminUserActivityCategory =
  | "all"
  | "payments"
  | "reports"
  | "content"
  | "engagement"
  | "admin";

export type AdminActivityActor = {
  uid: string;
  displayName: string;
  email: string | null;
};

export type AdminUserActivityItem = {
  id: string;
  kind: AdminUserActivityKind;
  at?: unknown;
  title: string;
  payload?: Record<string, string | number | boolean | null>;
  href?: string;
  /** Set only when the viewer is super_admin */
  actor?: AdminActivityActor | null;
};

export type AdminUserActivityResponse = {
  items: AdminUserActivityItem[];
  nextCursor: string | null;
  limitations: string[];
  viewerIsSuperAdmin: boolean;
};

export type AdminWorkAuditItem = {
  id: string;
  action: string;
  at?: unknown;
  workTitle?: string;
  note?: string;
  actor?: AdminActivityActor | null;
};

export type AdminUserDetail = {
  uid: string;
  displayName: string;
  email: string | null;
  emailVerified: boolean;
  age?: number | null;
  birthDate?: string | null;
  gender?: UserGender | null;
  locale?: Locale | null;
  isStudent: boolean;
  schoolName?: string;
  platformPurpose: PlatformPurpose;
  role: UserRole;
  defaultDirectorName?: string;
  directorNameChangeRequest?: DirectorNameChangeRequest;
  handle?: string;
  displayNameChangeRequest?: DirectorNameChangeRequest;
  handleChangeRequest?: DirectorNameChangeRequest;
  createdAt?: unknown;
  updatedAt?: unknown;
  visitCount: number;
  lastVisitAt?: unknown;
  depositVerified: boolean;
  works: AdminUserWorkSummary[];
};

export type AdminWorkDetailOwner = {
  uid: string;
  email: string | null;
  displayName: string;
};

export type AdminWorkDetail = {
  work: WorkDoc & { id: string };
  owner: AdminWorkDetailOwner;
  playbackUrl?: string;
  auditLog?: AdminWorkAuditItem[];
  promo?: {
    id: string;
    platformStatus: PromoPlatformStatus;
    streamStatus?: StreamStatus;
    clipStartSec: number;
    clipEndSec: number;
    title?: string;
    playbackUrl?: string;
    deletionRequest?: WorkDoc["deletionRequest"];
    rejectReason?: string;
  };
};
