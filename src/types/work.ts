export const WORK_CATEGORIES = [
  "movies",
  "series",
  "entertainment",
  "shorts",
  "school-battle",
] as const;

export type WorkCategory = (typeof WORK_CATEGORIES)[number];

export type PlatformStatus = "pending" | "published" | "rejected" | "removal_requested";

export type PromoPlatformStatus = "draft" | "pending" | "published" | "rejected" | "removal_requested";

export type StreamStatus = "uploading" | "processing" | "ready" | "error";

export type DeletionRequest = {
  reason: string;
  requestedAt: unknown;
};

export type WorkDoc = {
  kind: "full";
  category: WorkCategory;
  title: string;
  description?: string;
  director?: string;
  platformStatus: PlatformStatus;
  streamStatus: StreamStatus;
  streamUid: string;
  sortOrder: number;
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
