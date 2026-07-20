import { FieldValue, type Firestore } from "firebase-admin/firestore";
import {
  parsePromoPendingRevision,
  parseRevisionReviewStatus,
  parseWorkPendingRevision,
} from "@/lib/server/revision-parse";
// parsePromoPendingRevision reused for prologue pendingRevision shape
import type {
  PlatformStatus,
  PromoFrameCrop,
  PromoPlatformStatus,
  PromoShortDoc,
  RejectReasonCode,
  StreamStatus,
  PrologueDraft,
  PrologueShortDoc,
  PromoDraft,
  WorkDoc,
  WorkSection,
  WorkVideoMaster,
  WorkVideoStaging,
} from "@/types/work";
import type { SourceVideoQuality } from "@/lib/works/source-video-quality";
import { PROMO_SHORT_DOC_ID, PROLOGUE_SHORT_DOC_ID } from "@/types/work";
import { parseContentModeration } from "@/lib/server/moderation/parse-content-moderation";
import { getStreamThumbnailUrl, getStreamVideo } from "@/lib/cloudflare/stream";
import { getAdminDb } from "@/lib/server/firebase-admin";
import { isRejectReasonCode, isWorkSection } from "@/lib/works/constants";
import { isVideoAspectRatio } from "@/lib/works/aspect-ratio";
import type { VideoAspectRatio } from "@/types/work";

function parseAspectRatio(data: Record<string, unknown>, key: string): VideoAspectRatio | undefined {
  const v = data[key];
  if (typeof v !== "string" || !isVideoAspectRatio(v)) return undefined;
  return v;
}

export function worksCol(db: Firestore, uid: string) {
  return db.collection("users").doc(uid).collection("works");
}

export function promoRef(db: Firestore, uid: string, workId: string) {
  return worksCol(db, uid).doc(workId).collection("promoShort").doc(PROMO_SHORT_DOC_ID);
}

export function prologueRef(db: Firestore, uid: string, workId: string) {
  return worksCol(db, uid).doc(workId).collection("prologueShort").doc(PROLOGUE_SHORT_DOC_ID);
}

function parseSection(data: Record<string, unknown>): WorkSection {
  const raw = data.section ?? data.category;
  const s = String(raw ?? "movies");
  return isWorkSection(s) ? s : "movies";
}

export function parsePrologueDraft(data: Record<string, unknown>): PrologueDraft | undefined {
  const raw = data.prologueDraft;
  if (!raw || typeof raw !== "object") return undefined;
  const d = raw as Record<string, unknown>;
  const title = typeof d.title === "string" ? d.title.trim() : "";
  const description =
    typeof d.description === "string" && d.description.trim() ? d.description.trim() : null;
  if (!title && !description) return undefined;
  return {
    title: title ? title.slice(0, 200) : undefined,
    description,
  };
}

export function parsePromoDraft(data: Record<string, unknown>): PromoDraft | undefined {
  const raw = data.promoDraft;
  if (!raw || typeof raw !== "object") return undefined;
  const d = raw as Record<string, unknown>;
  const title = typeof d.title === "string" ? d.title.trim() : "";
  if (!title) return undefined;
  const thumbnailUrl =
    typeof d.thumbnailUrl === "string" && d.thumbnailUrl.trim()
      ? d.thumbnailUrl.trim()
      : null;
  return {
    title: title.slice(0, 200),
    description:
      typeof d.description === "string" && d.description.trim()
        ? d.description.trim()
        : null,
    thumbnailUrl,
    thumbnailCrop: parsePromoFrameCrop(d.thumbnailCrop),
  };
}

function parseStringArray(data: Record<string, unknown>, key: string): string[] | undefined {
  const v = data[key];
  if (!Array.isArray(v)) return undefined;
  return v.map((x) => String(x)).filter(Boolean);
}

function parseWorkVideoStaging(value: unknown): WorkVideoStaging | undefined {
  if (!value || typeof value !== "object") return undefined;
  const row = value as Record<string, unknown>;
  const fullPath = typeof row.fullPath === "string" ? row.fullPath.trim() : "";
  const promoPath = typeof row.promoPath === "string" ? row.promoPath.trim() : "";
  if (!fullPath || !promoPath) return undefined;
  const prologuePath = typeof row.prologuePath === "string" ? row.prologuePath.trim() : "";
  return {
    fullPath,
    promoPath,
    ...(prologuePath ? { prologuePath } : {}),
    fullBytes: typeof row.fullBytes === "number" ? row.fullBytes : undefined,
    promoBytes: typeof row.promoBytes === "number" ? row.promoBytes : undefined,
    prologueBytes: typeof row.prologueBytes === "number" ? row.prologueBytes : undefined,
    fullContentType: typeof row.fullContentType === "string" ? row.fullContentType : undefined,
    promoContentType: typeof row.promoContentType === "string" ? row.promoContentType : undefined,
    prologueContentType:
      typeof row.prologueContentType === "string" ? row.prologueContentType : undefined,
    promoTrimStartSec:
      typeof row.promoTrimStartSec === "number" ? row.promoTrimStartSec : undefined,
    promoTrimEndSec:
      typeof row.promoTrimEndSec === "number" ? row.promoTrimEndSec : undefined,
    updatedAt: row.updatedAt,
  };
}

const SOURCE_VIDEO_QUALITIES = new Set<SourceVideoQuality>([
  "sd",
  "hd",
  "full_hd",
  "2k",
  "4k",
  "8k",
]);

function parseWorkVideoMaster(value: unknown): WorkVideoMaster | undefined {
  if (!value || typeof value !== "object") return undefined;
  const row = value as Record<string, unknown>;
  const storagePath = typeof row.storagePath === "string" ? row.storagePath.trim() : "";
  if (!storagePath) return undefined;
  const sourceQuality =
    typeof row.sourceQuality === "string" &&
    SOURCE_VIDEO_QUALITIES.has(row.sourceQuality as SourceVideoQuality)
      ? (row.sourceQuality as SourceVideoQuality)
      : undefined;
  return {
    storagePath,
    originalFileName:
      typeof row.originalFileName === "string" ? row.originalFileName : undefined,
    bytes: typeof row.bytes === "number" ? row.bytes : undefined,
    contentType: typeof row.contentType === "string" ? row.contentType : undefined,
    width: typeof row.width === "number" ? row.width : undefined,
    height: typeof row.height === "number" ? row.height : undefined,
    durationSec: typeof row.durationSec === "number" ? row.durationSec : undefined,
    sourceQuality,
    highResolutionEligible: row.highResolutionEligible === true,
    playbackMaxHeight: 1080,
    preservationStatus: "preserved",
    storageProvider: "firebase",
    updatedAt: row.updatedAt,
  };
}

function parsePromoFrameCrop(value: unknown): PromoFrameCrop | undefined {
  if (!value || typeof value !== "object") return undefined;
  const row = value as Record<string, unknown>;
  const focalX = typeof row.focalX === "number" ? row.focalX : NaN;
  const focalY = typeof row.focalY === "number" ? row.focalY : NaN;
  const zoom = typeof row.zoom === "number" ? row.zoom : NaN;
  if (!Number.isFinite(focalX) || !Number.isFinite(focalY) || !Number.isFinite(zoom)) return undefined;
  return { focalX, focalY, zoom };
}

export function parseWorkDoc(id: string, data: Record<string, unknown>): WorkDoc & { id: string } {
  const rejectCode = data.rejectReasonCode;
  return {
    id,
    kind: "full",
    section: parseSection(data),
    title: String(data.title ?? "Untitled"),
    description: data.description ? String(data.description) : undefined,
    director: data.director ? String(data.director) : undefined,
    proposedCategory: data.proposedCategory ? String(data.proposedCategory) : undefined,
    approvedCategory: data.approvedCategory ? String(data.approvedCategory) : undefined,
    proposedTags: parseStringArray(data, "proposedTags"),
    approvedTags: parseStringArray(data, "approvedTags"),
    proposedAspectRatio: parseAspectRatio(data, "proposedAspectRatio"),
    approvedAspectRatio: parseAspectRatio(data, "approvedAspectRatio"),
    proposedSchoolId: data.proposedSchoolId ? String(data.proposedSchoolId) : undefined,
    proposedSchoolName: data.proposedSchoolName ? String(data.proposedSchoolName) : undefined,
    approvedSchoolId: data.approvedSchoolId ? String(data.approvedSchoolId) : undefined,
    approvedSchoolName: data.approvedSchoolName ? String(data.approvedSchoolName) : undefined,
    platformStatus: (data.platformStatus as PlatformStatus) ?? "pending",
    streamStatus: (data.streamStatus as StreamStatus) ?? "uploading",
    streamUid: data.streamUid ? String(data.streamUid) : undefined,
    videoStaging: parseWorkVideoStaging(data.videoStaging),
    videoMaster: parseWorkVideoMaster(data.videoMaster),
    sortOrder: typeof data.sortOrder === "number" ? data.sortOrder : 0,
    rejectReasonCode:
      typeof rejectCode === "string" && isRejectReasonCode(rejectCode) ? rejectCode : undefined,
    rejectReason: data.rejectReason ? String(data.rejectReason) : undefined,
    deletionRequest: data.deletionRequest as WorkDoc["deletionRequest"],
    publishedAt: data.publishedAt,
    reviewedAt: data.reviewedAt,
    reviewedBy: data.reviewedBy ? String(data.reviewedBy) : undefined,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    likeCount: typeof data.likeCount === "number" ? data.likeCount : 0,
    viewCount: typeof data.viewCount === "number" ? data.viewCount : 0,
    pendingRevision: parseWorkPendingRevision(data),
    revisionReviewStatus: parseRevisionReviewStatus(data),
    promoDraft: parsePromoDraft(data),
    prologueDraft: parsePrologueDraft(data),
    contentModeration: parseContentModeration(data),
    portfolioSubmissionHidden: data.portfolioSubmissionHidden === true,
  };
}

function parseCount(data: Record<string, unknown>, key: string): number {
  return typeof data[key] === "number" ? (data[key] as number) : 0;
}

export function parsePrologueDoc(data: Record<string, unknown>): PrologueShortDoc {
  return {
    platformStatus: (data.platformStatus as PrologueShortDoc["platformStatus"]) ?? "draft",
    streamStatus: data.streamStatus as StreamStatus | undefined,
    streamUid: data.streamUid ? String(data.streamUid) : undefined,
    durationSec: typeof data.durationSec === "number" ? data.durationSec : undefined,
    streamError:
      typeof data.streamError === "string" && data.streamError.trim()
        ? data.streamError.trim()
        : null,
    title: data.title ? String(data.title) : undefined,
    description: data.description ? String(data.description) : undefined,
    rejectReason: data.rejectReason ? String(data.rejectReason) : undefined,
    deletionRequest: data.deletionRequest as PrologueShortDoc["deletionRequest"],
    submittedAt: data.submittedAt,
    publishedAt: data.publishedAt,
    reviewedAt: data.reviewedAt,
    reviewedBy: data.reviewedBy ? String(data.reviewedBy) : undefined,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    pendingRevision: parsePromoPendingRevision(data),
    revisionReviewStatus: parseRevisionReviewStatus(data),
    contentModeration: parseContentModeration(data),
  };
}

export function parsePromoDoc(data: Record<string, unknown>): PromoShortDoc {
  return {
    platformStatus: (data.platformStatus as PromoPlatformStatus) ?? "draft",
    streamStatus: data.streamStatus as StreamStatus | undefined,
    streamUid: data.streamUid ? String(data.streamUid) : undefined,
    clipStartSec: typeof data.clipStartSec === "number" ? data.clipStartSec : 0,
    clipEndSec: typeof data.clipEndSec === "number" ? data.clipEndSec : 0,
    durationSec: typeof data.durationSec === "number" ? data.durationSec : undefined,
    streamError:
      typeof data.streamError === "string" && data.streamError.trim()
        ? data.streamError.trim()
        : null,
    sourceStreamUid: data.sourceStreamUid ? String(data.sourceStreamUid) : undefined,
    sourceStreamStatus: data.sourceStreamStatus as StreamStatus | undefined,
    sourceClipStartSec:
      typeof data.sourceClipStartSec === "number" ? data.sourceClipStartSec : undefined,
    sourceClipEndSec:
      typeof data.sourceClipEndSec === "number" ? data.sourceClipEndSec : undefined,
    sourceClipStatus:
      data.sourceClipStatus === "creating" ||
      data.sourceClipStatus === "processing" ||
      data.sourceClipStatus === "error"
        ? data.sourceClipStatus
        : undefined,
    title: data.title ? String(data.title) : undefined,
    description: data.description ? String(data.description) : undefined,
    thumbnailUrl:
      typeof data.thumbnailUrl === "string" && data.thumbnailUrl.trim()
        ? data.thumbnailUrl.trim()
        : null,
    thumbnailCrop: parsePromoFrameCrop(data.thumbnailCrop),
    frameCrop: parsePromoFrameCrop(data.frameCrop),
    rejectReason: data.rejectReason ? String(data.rejectReason) : undefined,
    deletionRequest: data.deletionRequest as PromoShortDoc["deletionRequest"],
    submittedAt: data.submittedAt,
    publishedAt: data.publishedAt,
    reviewedAt: data.reviewedAt,
    reviewedBy: data.reviewedBy ? String(data.reviewedBy) : undefined,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    likeCount: parseCount(data, "likeCount"),
    viewCount: parseCount(data, "viewCount"),
    pendingRevision: parsePromoPendingRevision(data),
    revisionReviewStatus: parseRevisionReviewStatus(data),
    contentModeration: parseContentModeration(data),
  };
}

export async function nextWorkSortOrder(db: Firestore, uid: string): Promise<number> {
  const snap = await worksCol(db, uid).orderBy("sortOrder", "desc").limit(1).get();
  if (snap.empty) return Date.now();
  const top = snap.docs[0].data().sortOrder;
  return (typeof top === "number" ? top : 0) + 1;
}

export function canOwnerDeleteWork(platformStatus: PlatformStatus): boolean {
  return platformStatus !== "published" && platformStatus !== "removal_requested";
}

export function canOwnerDeletePromo(platformStatus: PromoPlatformStatus): boolean {
  return platformStatus !== "published" && platformStatus !== "removal_requested";
}

export function canOwnerDeletePrologue(platformStatus: PromoPlatformStatus): boolean {
  return canOwnerDeletePromo(platformStatus);
}

export async function getDbOrNull() {
  return getAdminDb();
}

/** 홈 카탈로그와 동일 우선순위: 프로모 썸네일 → draft → Stream 기본 */
export async function resolveWorkListThumbnailUrl(
  db: Firestore,
  ownerUid: string,
  workId: string,
  work: Pick<WorkDoc, "streamUid" | "promoDraft">
): Promise<string | undefined> {
  const promoSnap = await promoRef(db, ownerUid, workId).get();
  if (promoSnap.exists) {
    const promo = parsePromoDoc(promoSnap.data() as Record<string, unknown>);
    if (promo.thumbnailUrl) return promo.thumbnailUrl;
  }
  if (work.promoDraft?.thumbnailUrl) return work.promoDraft.thumbnailUrl;
  if (work.streamUid) {
    const fromSubdomain = getStreamThumbnailUrl(work.streamUid);
    if (fromSubdomain) return fromSubdomain;
    const info = await getStreamVideo(work.streamUid);
    if (info?.thumbnail) return info.thumbnail;
  }
  return undefined;
}

export { FieldValue };
