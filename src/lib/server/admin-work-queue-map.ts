import type { Firestore, QueryDocumentSnapshot } from "firebase-admin/firestore";
import { resolveReviewPlaybackUrl } from "@/lib/cloudflare/stream";
import {
  syncPrologueRevisionStreamStatusIfNeeded,
  syncPrologueStreamStatusIfNeeded,
  syncPromoRevisionStreamStatusIfNeeded,
  syncPromoStreamStatusIfNeeded,
  syncWorkRevisionStreamStatusIfNeeded,
  syncWorkStreamStatusIfNeeded,
} from "@/lib/server/sync-stream-status";
import { FALLBACK_WORK_TITLE, resolveDisplayTitle } from "@/lib/works/display-title";
import { parsePrologueDoc, parsePromoDoc, parseWorkDoc, worksCol } from "@/lib/server/works";
import { PROLOGUE_SHORT_DOC_ID, PROMO_SHORT_DOC_ID } from "@/types/work";

export async function mapFullWorkQueueItem(
  db: Firestore,
  doc: QueryDocumentSnapshot,
  isRevision: boolean
) {
  let work = parseWorkDoc(doc.id, doc.data() as Record<string, unknown>);
  const ownerUid = doc.ref.parent.parent?.id ?? "";
  const rev = work.pendingRevision;
  const streamUid = isRevision ? rev?.streamUid : work.streamUid;
  let streamStatus = isRevision ? rev?.streamStatus : work.streamStatus;
  if (ownerUid && streamUid && streamStatus) {
    const synced = isRevision
      ? await syncWorkRevisionStreamStatusIfNeeded(db, ownerUid, doc.id, streamUid, streamStatus)
      : await syncWorkStreamStatusIfNeeded(db, ownerUid, doc.id, streamUid, streamStatus);
    streamStatus = synced ?? streamStatus;
    if (isRevision && rev) {
      work = { ...work, pendingRevision: { ...rev, streamStatus } };
    } else {
      work = { ...work, streamStatus };
    }
  }
  const userSnap = ownerUid ? await db.collection("users").doc(ownerUid).get() : null;
  const playbackUrl =
    streamUid && streamStatus === "ready" ? await resolveReviewPlaybackUrl(streamUid) : undefined;
  const catalogThumbnailUrl =
    work.promoDraft?.thumbnailUrl?.trim() || null;
  return {
    ...work,
    contentModeration: isRevision ? rev?.contentModeration : work.contentModeration,
    ...(isRevision && rev
      ? {
          title: resolveDisplayTitle(FALLBACK_WORK_TITLE, rev.title, work.title),
          section: rev.section ?? work.section,
          description: rev.description ?? work.description,
          director: rev.director ?? work.director,
          proposedCategory: rev.proposedCategory ?? work.proposedCategory,
          proposedTags: rev.proposedTags ?? work.proposedTags,
          proposedAspectRatio: rev.proposedAspectRatio ?? work.proposedAspectRatio,
        }
      : {}),
    ownerUid,
    ownerEmail: userSnap?.data()?.email ?? null,
    ownerName: userSnap?.data()?.displayName ?? null,
    playbackUrl,
    catalogThumbnailUrl,
    isRevision,
  };
}

export async function mapPromoWorkQueueItem(
  db: Firestore,
  promoDoc: QueryDocumentSnapshot,
  isRevision: boolean
) {
  const parsed = parsePromoDoc(promoDoc.data() as Record<string, unknown>);
  const workRef = promoDoc.ref.parent.parent;
  if (!workRef) return null;
  const workId = workRef.id;
  const ownerUid = workRef.parent.parent?.id ?? "";
  const rev = parsed.pendingRevision;
  const streamUid = isRevision ? rev?.streamUid : parsed.streamUid;
  let streamStatus = isRevision ? rev?.streamStatus : parsed.streamStatus;
  if (ownerUid && streamUid && streamStatus) {
    streamStatus = isRevision
      ? await syncPromoRevisionStreamStatusIfNeeded(db, ownerUid, workId, streamUid, streamStatus)
      : await syncPromoStreamStatusIfNeeded(db, ownerUid, workId, streamUid, streamStatus);
  }
  const promoDescription = isRevision && rev ? rev.description : parsed.description;
  const promo = isRevision && rev
    ? {
        ...parsed,
        title: rev.title ?? parsed.title,
        description: promoDescription,
        clipStartSec: rev.clipStartSec,
        clipEndSec: rev.clipEndSec,
        streamUid,
        streamStatus,
      }
    : { ...parsed, streamStatus, description: parsed.description };
  const workSnap = await worksCol(db, ownerUid).doc(workId).get();
  if (!workSnap.exists) return null;
  const work = parseWorkDoc(workId, workSnap.data() as Record<string, unknown>);
  const workTitle = resolveDisplayTitle(FALLBACK_WORK_TITLE, work.title);
  const promoTitle = resolveDisplayTitle(FALLBACK_WORK_TITLE, promo.title, work.title);
  const userSnap = await db.collection("users").doc(ownerUid).get();
  const playbackUrl =
    streamUid && streamStatus === "ready" ? await resolveReviewPlaybackUrl(streamUid) : undefined;
  const catalogThumbnailUrl =
    promo.thumbnailUrl?.trim() || work.promoDraft?.thumbnailUrl?.trim() || null;

  let livePromo:
    | {
        title?: string;
        description?: string;
        clipStartSec: number;
        clipEndSec: number;
        playbackUrl?: string;
      }
    | undefined;
  if (isRevision && parsed.platformStatus === "published") {
    const livePlayback =
      parsed.streamUid && parsed.streamStatus === "ready"
        ? await resolveReviewPlaybackUrl(parsed.streamUid)
        : undefined;
    livePromo = {
      title: resolveDisplayTitle(FALLBACK_WORK_TITLE, parsed.title, work.title),
      description: parsed.description,
      clipStartSec: parsed.clipStartSec ?? 0,
      clipEndSec: parsed.clipEndSec ?? 0,
      playbackUrl: livePlayback ?? undefined,
    };
  }

  const promoModeration = isRevision ? rev?.contentModeration : parsed.contentModeration;

  return {
    promo: {
      id: PROMO_SHORT_DOC_ID,
      ...promo,
      title: promoTitle,
      playbackUrl,
      description: promoDescription ?? promo.description,
      contentModeration: promoModeration,
      pendingRevision: isRevision && rev ? { contentModeration: rev.contentModeration } : undefined,
    },
    livePromo,
    work: { ...work, id: workId, title: workTitle },
    catalogThumbnailUrl,
    workId,
    ownerUid,
    ownerEmail: userSnap.data()?.email ?? null,
    ownerName: userSnap.data()?.displayName ?? null,
    isRevision,
  };
}

export async function mapPrologueWorkQueueItem(
  db: Firestore,
  prologueDoc: QueryDocumentSnapshot,
  isRevision: boolean
) {
  const parsed = parsePrologueDoc(prologueDoc.data() as Record<string, unknown>);
  const workRef = prologueDoc.ref.parent.parent;
  if (!workRef) return null;
  const workId = workRef.id;
  const ownerUid = workRef.parent.parent?.id ?? "";
  const rev = parsed.pendingRevision;
  const streamUid = isRevision ? rev?.streamUid : parsed.streamUid;
  let streamStatus = isRevision ? rev?.streamStatus : parsed.streamStatus;
  if (ownerUid && streamUid && streamStatus) {
    streamStatus = isRevision
      ? await syncPrologueRevisionStreamStatusIfNeeded(db, ownerUid, workId, streamUid, streamStatus)
      : await syncPrologueStreamStatusIfNeeded(db, ownerUid, workId, streamUid, streamStatus);
  }
  const prologueDescription = isRevision && rev ? rev.description : parsed.description;
  const prologue = isRevision && rev
    ? {
        ...parsed,
        title: rev.title ?? parsed.title,
        description: prologueDescription,
        streamUid,
        streamStatus,
      }
    : { ...parsed, streamStatus, description: parsed.description };
  const workSnap = await worksCol(db, ownerUid).doc(workId).get();
  if (!workSnap.exists) return null;
  const work = parseWorkDoc(workId, workSnap.data() as Record<string, unknown>);
  const workTitle = resolveDisplayTitle(FALLBACK_WORK_TITLE, work.title);
  const prologueTitle = resolveDisplayTitle(FALLBACK_WORK_TITLE, prologue.title, work.title);
  const userSnap = await db.collection("users").doc(ownerUid).get();
  const playbackUrl =
    streamUid && streamStatus === "ready" ? await resolveReviewPlaybackUrl(streamUid) : undefined;

  let livePrologue:
    | { title?: string; description?: string; playbackUrl?: string; durationSec?: number }
    | undefined;
  if (isRevision && parsed.platformStatus === "published") {
    const livePlayback =
      parsed.streamUid && parsed.streamStatus === "ready"
        ? await resolveReviewPlaybackUrl(parsed.streamUid)
        : undefined;
    livePrologue = {
      title: resolveDisplayTitle(FALLBACK_WORK_TITLE, parsed.title, work.title),
      description: parsed.description,
      durationSec: parsed.durationSec,
      playbackUrl: livePlayback ?? undefined,
    };
  }

  const prologueModeration = isRevision ? rev?.contentModeration : parsed.contentModeration;

  return {
    prologue: {
      id: PROLOGUE_SHORT_DOC_ID,
      ...prologue,
      title: prologueTitle,
      playbackUrl,
      description: prologueDescription ?? prologue.description,
      contentModeration: prologueModeration,
      pendingRevision: isRevision && rev ? { contentModeration: rev.contentModeration } : undefined,
    },
    livePrologue,
    work: { ...work, id: workId, title: workTitle },
    workId,
    ownerUid,
    ownerEmail: userSnap.data()?.email ?? null,
    ownerName: userSnap.data()?.displayName ?? null,
    isRevision,
  };
}
