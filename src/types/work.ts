/** 홈 탭 / URL 노출 구역 (기존 category 필드) */
export const WORK_SECTIONS = [
  "movies",
  "series",
  "entertainment",
  "shorts",
] as const;

export type WorkSection = (typeof WORK_SECTIONS)[number];

/** @deprecated use WORK_SECTIONS */
export const WORK_CATEGORIES = WORK_SECTIONS;
/** @deprecated use WorkSection */
export type WorkCategory = WorkSection;

export type PlatformStatus = "draft" | "pending" | "published" | "rejected" | "removal_requested";

export type PromoPlatformStatus = "draft" | "pending" | "published" | "rejected" | "removal_requested";

export type StreamStatus = "staged" | "uploading" | "processing" | "ready" | "error";

/** Firebase Storage 원본 — 심사 제출 시 Stream으로 1회 업로드 */
export type WorkVideoStaging = {
  fullPath: string;
  promoPath: string;
  /** 선택 — 프롤로그 스테이징 */
  prologuePath?: string;
  fullBytes?: number;
  promoBytes?: number;
  prologueBytes?: number;
  fullContentType?: string;
  promoContentType?: string;
  prologueContentType?: string;
  /** Optional source range used when a promo upload is longer than 120 seconds. */
  promoTrimStartSec?: number;
  /** Optional source range used when a promo upload is longer than 120 seconds. */
  promoTrimEndSec?: number;
  updatedAt?: unknown;
};

/** 업로드 시 선택하는 목표 화면 비율 */
export const WORK_ASPECT_RATIOS = ["16:9", "9:16", "4:3", "1:1", "21:9"] as const;

export type VideoAspectRatio = (typeof WORK_ASPECT_RATIOS)[number];

import type { ContentModeration } from "@/types/moderation";

export type RejectReasonCode = "category_mismatch" | "tag_mismatch" | "other";

export type DeletionRequest = {
  reason: string;
  requestedAt: unknown;
};

/** 게시 후 수정 제안 — 승인 전까지 공개본은 유지 */
export type RevisionReviewStatus = "pending" | "rejected";

export type WorkPendingRevision = {
  platformStatus: "draft" | "pending" | "rejected";
  streamUid?: string;
  streamStatus?: StreamStatus;
  section?: WorkSection;
  title?: string;
  description?: string;
  director?: string;
  proposedCategory?: string;
  proposedTags?: string[];
  proposedAspectRatio?: VideoAspectRatio;
  /** 대표하는 학교 — school-battle 아님, 콘텐츠 발견용 태그 */
  proposedSchoolId?: string;
  proposedSchoolName?: string;
  rejectReason?: string;
  rejectReasonCode?: RejectReasonCode;
  submittedAt?: unknown;
  updatedAt?: unknown;
  contentModeration?: ContentModeration;
};

/** 업로드 시 저장 — 쇼츠 메타(영상은 promo 문서에 별도 TUS) */
export type PromoDraft = {
  title: string;
  description?: string | null;
  thumbnailUrl?: string | null;
  thumbnailCrop?: PromoFrameCrop;
};

export type PromoPendingRevision = {
  platformStatus: "draft" | "pending" | "rejected";
  streamUid?: string;
  streamStatus?: StreamStatus;
  /** @deprecated legacy clip promos */
  clipStartSec?: number;
  /** @deprecated legacy clip promos */
  clipEndSec?: number;
  durationSec?: number;
  title?: string;
  description?: string;
  thumbnailUrl?: string | null;
  thumbnailCrop?: PromoFrameCrop;
  frameCrop?: PromoFrameCrop;
  rejectReason?: string;
  submittedAt?: unknown;
  updatedAt?: unknown;
  contentModeration?: ContentModeration;
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
  /** 업로드 시 선택한 대표 학교 — schools/{schoolId} 참조, 어드민 승인 전 */
  proposedSchoolId?: string;
  proposedSchoolName?: string;
  /** 어드민 승인 시 확정 (학교 페이지·랭킹 집계용) */
  approvedSchoolId?: string;
  approvedSchoolName?: string;
  platformStatus: PlatformStatus;
  streamStatus: StreamStatus;
  streamUid?: string;
  /** 제출 전 원본 영상 경로 (Storage) */
  videoStaging?: WorkVideoStaging;
  sortOrder: number;
  rejectReasonCode?: RejectReasonCode;
  rejectReason?: string;
  deletionRequest?: DeletionRequest;
  publishedAt?: unknown;
  reviewedAt?: unknown;
  reviewedBy?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
  likeCount?: number;
  viewCount?: number;
  pendingRevision?: WorkPendingRevision;
  revisionReviewStatus?: RevisionReviewStatus;
  promoDraft?: PromoDraft;
  prologueDraft?: PrologueDraft;
  contentModeration?: ContentModeration;
  /** 포트폴리오 제출 링크에서 기본 제외 (includedWorkIds로만 포함 가능) */
  portfolioSubmissionHidden?: boolean;
};

export type PromoShortDoc = {
  platformStatus: PromoPlatformStatus;
  streamStatus?: StreamStatus;
  streamUid?: string;
  /** @deprecated legacy clip from full work; file-upload promos use 0..durationSec */
  clipStartSec?: number;
  /** @deprecated legacy clip from full work */
  clipEndSec?: number;
  durationSec?: number;
  streamError?: string | null;
  /** Temporary long source uploaded to Stream before the final <=120s clip is created. */
  sourceStreamUid?: string;
  sourceStreamStatus?: StreamStatus;
  sourceClipStartSec?: number;
  sourceClipEndSec?: number;
  sourceClipStatus?: "creating" | "processing" | "error";
  title?: string;
  description?: string;
  thumbnailUrl?: string | null;
  thumbnailCrop?: PromoFrameCrop;
  frameCrop?: PromoFrameCrop;
  rejectReason?: string;
  deletionRequest?: DeletionRequest;
  submittedAt?: unknown;
  publishedAt?: unknown;
  reviewedAt?: unknown;
  reviewedBy?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
  likeCount?: number;
  viewCount?: number;
  pendingRevision?: PromoPendingRevision;
  revisionReviewStatus?: RevisionReviewStatus;
  contentModeration?: ContentModeration;
};

export type PromoFrameCrop = {
  /** horizontal focus percentage in portrait frame */
  focalX: number;
  /** vertical focus percentage in portrait frame */
  focalY: number;
  /** zoom multiplier for portrait framing */
  zoom: number;
};

export const PROMO_SHORT_DOC_ID = "promo";

/** 업로드 시 저장 — 프롤로그 메타(영상은 prologue 문서에 별도 TUS) */
export type PrologueDraft = {
  title?: string;
  description?: string | null;
};

export type ProloguePendingRevision = PromoPendingRevision;

/** 본편 전 재생 — 썸네일·세로 크롭 없음 */
export type PrologueShortDoc = {
  platformStatus: PromoPlatformStatus;
  streamStatus?: StreamStatus;
  streamUid?: string;
  durationSec?: number;
  streamError?: string | null;
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
  pendingRevision?: ProloguePendingRevision;
  revisionReviewStatus?: RevisionReviewStatus;
  contentModeration?: ContentModeration;
};

export const PROLOGUE_SHORT_DOC_ID = "prologue";

export type WorkListItem = WorkDoc & {
  id: string;
  promo?: (PromoShortDoc & { id: string }) | null;
  prologue?: (PrologueShortDoc & { id: string }) | null;
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
  frameCrop?: PromoFrameCrop;
  streamUid?: string;
  thumbnailUrl?: string;
  likeCount?: number;
  viewCount?: number;
  likedByMe?: boolean;
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
  approvedSchoolId?: string;
  approvedSchoolName?: string;
  thumbnailUrl?: string;
  thumbnailCrop?: PromoFrameCrop;
  viewCount?: number;
  likeCount?: number;
  publishedAt?: unknown;
};

export type WatchProgressItem = CatalogFeedItem & {
  positionSec: number;
  durationSec: number;
  progressPercent: number;
};
