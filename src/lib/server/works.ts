import { FieldValue, type Firestore } from "firebase-admin/firestore";
import type {
  PlatformStatus,
  PromoPlatformStatus,
  PromoShortDoc,
  StreamStatus,
  WorkCategory,
  WorkDoc,
} from "@/types/work";
import { PROMO_SHORT_DOC_ID } from "@/types/work";
import { getAdminDb } from "@/lib/server/firebase-admin";

export function worksCol(db: Firestore, uid: string) {
  return db.collection("users").doc(uid).collection("works");
}

export function promoRef(db: Firestore, uid: string, workId: string) {
  return worksCol(db, uid).doc(workId).collection("promoShort").doc(PROMO_SHORT_DOC_ID);
}

export function parseWorkDoc(id: string, data: Record<string, unknown>): WorkDoc & { id: string } {
  return {
    id,
    kind: "full",
    category: (data.category as WorkCategory) ?? "movies",
    title: String(data.title ?? "Untitled"),
    description: data.description ? String(data.description) : undefined,
    director: data.director ? String(data.director) : undefined,
    platformStatus: (data.platformStatus as PlatformStatus) ?? "pending",
    streamStatus: (data.streamStatus as StreamStatus) ?? "uploading",
    streamUid: String(data.streamUid ?? ""),
    sortOrder: typeof data.sortOrder === "number" ? data.sortOrder : 0,
    rejectReason: data.rejectReason ? String(data.rejectReason) : undefined,
    deletionRequest: data.deletionRequest as WorkDoc["deletionRequest"],
    publishedAt: data.publishedAt,
    reviewedAt: data.reviewedAt,
    reviewedBy: data.reviewedBy ? String(data.reviewedBy) : undefined,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
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
