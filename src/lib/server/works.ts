import { FieldValue, type Firestore } from "firebase-admin/firestore";
import type {
  PlatformStatus,
  PromoPlatformStatus,
  PromoShortDoc,
  RejectReasonCode,
  StreamStatus,
  WorkDoc,
  WorkSection,
} from "@/types/work";
import { PROMO_SHORT_DOC_ID } from "@/types/work";
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

function parseSection(data: Record<string, unknown>): WorkSection {
  const raw = data.section ?? data.category;
  const s = String(raw ?? "movies");
  return isWorkSection(s) ? s : "movies";
}

function parseStringArray(data: Record<string, unknown>, key: string): string[] | undefined {
  const v = data[key];
  if (!Array.isArray(v)) return undefined;
  return v.map((x) => String(x)).filter(Boolean);
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
    platformStatus: (data.platformStatus as PlatformStatus) ?? "pending",
    streamStatus: (data.streamStatus as StreamStatus) ?? "uploading",
    streamUid: String(data.streamUid ?? ""),
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
  };
}

function parseCount(data: Record<string, unknown>, key: string): number {
  return typeof data[key] === "number" ? (data[key] as number) : 0;
}

export function parsePromoDoc(data: Record<string, unknown>): PromoShortDoc {
  return {
    platformStatus: (data.platformStatus as PromoPlatformStatus) ?? "draft",
    streamStatus: data.streamStatus as StreamStatus | undefined,
    streamUid: data.streamUid ? String(data.streamUid) : undefined,
    clipStartSec: typeof data.clipStartSec === "number" ? data.clipStartSec : 0,
    clipEndSec: typeof data.clipEndSec === "number" ? data.clipEndSec : 0,
    title: data.title ? String(data.title) : undefined,
    description: data.description ? String(data.description) : undefined,
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

export async function getDbOrNull() {
  return getAdminDb();
}

export { FieldValue };
