/** 홈 탭 / URL 노출 구역 (기존 category 필드) */
export const WORK_SECTIONS = [
  "movies",
  "series",
  "entertainment",
  "shorts",
  "school-battle",
] as const;

export type WorkSection = (typeof WORK_SECTIONS)[number];

/** @deprecated use WORK_SECTIONS */
export const WORK_CATEGORIES = WORK_SECTIONS;
/** @deprecated use WorkSection */
export type WorkCategory = WorkSection;

export type PlatformStatus = "pending" | "published" | "rejected" | "removal_requested";

export type PromoPlatformStatus = "draft" | "pending" | "published" | "rejected" | "removal_requested";

export type StreamStatus = "uploading" | "processing" | "ready" | "error";

/** 업로드 시 선택하는 목표 화면 비율 */
export const WORK_ASPECT_RATIOS = ["16:9", "9:16", "4:3", "1:1", "21:9"] as const;

export type VideoAspectRatio = (typeof WORK_ASPECT_RATIOS)[number];

export type RejectReasonCode = "category_mismatch" | "tag_mismatch" | "other";

export type DeletionRequest = {
  reason: string;
  requestedAt: unknown;
};

export type WorkDoc = {
  kind: "full";
  /** 홈·카테고리 탭 배치 */
  section: WorkSection;
  title: string;
  description?: string;
  director?: string;
  /** 작품 유형 (영화, 드라마, …) — 업로더 제안 */
  proposedCategory?: string;
  /** 어드민 확정, 공개용 */
  approvedCategory?: string;
  proposedTags?: string[];
  approvedTags?: string[];
  /** 업로더가 선택한 목표 화면 비율 */
  proposedAspectRatio?: VideoAspectRatio;
  /** 어드민 승인 시 확정 (공개·표시용) */
  approvedAspectRatio?: VideoAspectRatio;
  platformStatus: PlatformStatus;
  streamStatus: StreamStatus;
  streamUid: string;
  sortOrder: number;
  rejectReasonCode?: RejectReasonCode;
  rejectReason?: string;
  deletionRequest?: DeletionRequest;
  publishedAt?: unknown;
  reviewedAt?: unknown;
  reviewedBy?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type PromoShortDoc = {
  platformStatus: PromoPlatformStatus;
  streamStatus?: StreamStatus;
  streamUid?: string;
  clipStartSec: number;
  clipEndSec: number;
  title?: string;
  description?: string;
  rejectReason?: string;
  deletionRequest?: DeletionRequest;
  submittedAt?: unknown;
  publishedAt?: unknown;
  reviewedAt?: unknown;
  reviewedBy?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export const PROMO_SHORT_DOC_ID = "promo";

export type WorkListItem = WorkDoc & {
  id: string;
  promo?: (PromoShortDoc & { id: string }) | null;
  playbackUrl?: string;
};

export type PromoFeedItem = {
  id: string;
  workId: string;
  ownerUid: string;
  title: string;
  director: string;
  description: string;
  videoUrl: string;
  aspectRatio: number;
  likeCount?: number;
};

export type CatalogFeedItem = {
  id: string;
  workId: string;
  ownerUid: string;
  title: string;
  director?: string;
  section: WorkSection;
  approvedCategory?: string;
  approvedTags: string[];
  thumbnailUrl?: string;
};
