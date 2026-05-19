import type { Firestore } from "firebase-admin/firestore";
import { deleteStreamVideo } from "@/lib/cloudflare/stream";
import { normalizeContentCategory, normalizeTags } from "@/lib/works/label-utils";
import {
  parsePromoPendingRevision,
  parseRevisionReviewStatus,
  parseWorkPendingRevision,
} from "@/lib/server/revision-parse";
import type { PromoShortDoc, RejectReasonCode, VideoAspectRatio, WorkDoc } from "@/types/work";
import { FieldValue, promoRef, worksCol } from "@/lib/server/works";

async function deleteStreamSafe(uid: string | undefined) {
  if (!uid) return;
  try {
    await deleteStreamVideo(uid);
  } catch {
    /* ignore */
  }
}

export async function approvePromoRevision(
  db: Firestore,
  ownerUid: string,
  workId: string,
  reviewedBy: string
) {
  const ref = promoRef(db, ownerUid, workId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error("not_found");

  const data = snap.data() as Record<string, unknown>;
  const promo = data as PromoShortDoc & Record<string, unknown>;
  const rev = parsePromoPendingRevision(data);
  if (promo.platformStatus !== "published" || rev?.platformStatus !== "pending") {
    throw new Error("invalid_state");
  }
  if (rev.streamStatus !== "ready" || !rev.streamUid) {
    throw new Error("not_ready");
  }

  const oldStreamUid = promo.streamUid ? String(promo.streamUid) : undefined;

  await ref.update({
    platformStatus: "published",
    streamUid: rev.streamUid,
    streamStatus: "ready",
    clipStartSec: rev.clipStartSec,
    clipEndSec: rev.clipEndSec,
    title: rev.title ?? promo.title ?? null,
    description: rev.description ?? promo.description ?? null,
    publishedAt: FieldValue.serverTimestamp(),
    reviewedAt: FieldValue.serverTimestamp(),
    reviewedBy,
    rejectReason: FieldValue.delete(),
    pendingRevision: FieldValue.delete(),
    revisionReviewStatus: FieldValue.delete(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  if (oldStreamUid && oldStreamUid !== rev.streamUid) {
    await deleteStreamSafe(oldStreamUid);
  }
}

export async function rejectPromoRevision(
  db: Firestore,
  ownerUid: string,
  workId: string,
  reviewedBy: string,
  rejectReason: string
) {
  const ref = promoRef(db, ownerUid, workId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error("not_found");

  const data = snap.data() as Record<string, unknown>;
  const rev = parsePromoPendingRevision(data);
  if (parseRevisionReviewStatus(data) !== "pending" || rev?.platformStatus !== "pending") {
    throw new Error("invalid_state");
  }

  await deleteStreamSafe(rev?.streamUid);

  await ref.update({
    pendingRevision: {
      ...rev,
      platformStatus: "rejected",
      rejectReason: rejectReason.slice(0, 500),
    },
    revisionReviewStatus: "rejected",
    reviewedAt: FieldValue.serverTimestamp(),
    reviewedBy,
    updatedAt: FieldValue.serverTimestamp(),
  });
}

export async function approveWorkRevision(
  db: Firestore,
  ownerUid: string,
  workId: string,
  reviewedBy: string,
  opts: {
    approvedCategory?: string;
    approvedTags?: string[];
    approvedAspectRatio?: VideoAspectRatio;
  }
) {
  const ref = worksCol(db, ownerUid).doc(workId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error("not_found");

  const data = snap.data() as Record<string, unknown>;
  const work = data as WorkDoc & Record<string, unknown>;
  const rev = parseWorkPendingRevision(data);
  if (work.platformStatus !== "published" || rev?.platformStatus !== "pending") {
    throw new Error("invalid_state");
  }

  const hasNewVideo = Boolean(rev.streamUid);
  if (hasNewVideo && rev.streamStatus !== "ready") {
    throw new Error("not_ready");
  }

  const approvedCategoryRaw =
    opts.approvedCategory?.trim() ||
    rev.proposedCategory?.trim() ||
    work.approvedCategory?.trim() ||
    work.proposedCategory?.trim() ||
    "";
  const approvedCategory = approvedCategoryRaw
    ? normalizeContentCategory(approvedCategoryRaw)
    : work.approvedCategory ?? null;

  const tagSource =
    Array.isArray(opts.approvedTags) && opts.approvedTags.length > 0
      ? opts.approvedTags
      : (rev.proposedTags ?? work.approvedTags ?? work.proposedTags ?? []);
  const approvedTags = normalizeTags(tagSource);

  let approvedAspectRatio: VideoAspectRatio | null = work.approvedAspectRatio ?? work.proposedAspectRatio ?? null;
  if (opts.approvedAspectRatio) {
    approvedAspectRatio = opts.approvedAspectRatio;
  } else if (rev.proposedAspectRatio) {
    approvedAspectRatio = rev.proposedAspectRatio;
  }

  const oldStreamUid = work.streamUid ? String(work.streamUid) : undefined;
  const payload: Record<string, unknown> = {
    platformStatus: "published",
    section: rev.section ?? work.section,
    title: rev.title?.trim().slice(0, 200) || work.title,
    description: rev.description?.trim().slice(0, 2000) ?? work.description ?? null,
    director: rev.director?.trim().slice(0, 120) ?? work.director ?? null,
    proposedCategory: rev.proposedCategory ?? work.proposedCategory ?? null,
    proposedTags: rev.proposedTags ?? work.proposedTags ?? null,
    approvedCategory,
    approvedTags: approvedTags.length > 0 ? approvedTags : work.approvedTags ?? null,
    approvedAspectRatio,
    publishedAt: FieldValue.serverTimestamp(),
    reviewedAt: FieldValue.serverTimestamp(),
    reviewedBy,
    rejectReason: FieldValue.delete(),
    rejectReasonCode: FieldValue.delete(),
    pendingRevision: FieldValue.delete(),
    revisionReviewStatus: FieldValue.delete(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (hasNewVideo && rev.streamUid) {
    payload.streamUid = rev.streamUid;
    payload.streamStatus = "ready";
  }

  await ref.update(payload);

  if (hasNewVideo && oldStreamUid && oldStreamUid !== rev.streamUid) {
    await deleteStreamSafe(oldStreamUid);
  }
}

export async function rejectWorkRevision(
  db: Firestore,
  ownerUid: string,
  workId: string,
  reviewedBy: string,
  rejectReasonCode: RejectReasonCode,
  rejectReason: string
) {
  const ref = worksCol(db, ownerUid).doc(workId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error("not_found");

  const data = snap.data() as Record<string, unknown>;
  const rev = parseWorkPendingRevision(data);
  if (parseRevisionReviewStatus(data) !== "pending" || rev?.platformStatus !== "pending") {
    throw new Error("invalid_state");
  }

  await deleteStreamSafe(rev?.streamUid);

  await ref.update({
    pendingRevision: {
      ...rev,
      platformStatus: "rejected",
      rejectReasonCode,
      rejectReason: rejectReason.slice(0, 500),
    },
    revisionReviewStatus: "rejected",
    reviewedAt: FieldValue.serverTimestamp(),
    reviewedBy,
    updatedAt: FieldValue.serverTimestamp(),
  });
}
