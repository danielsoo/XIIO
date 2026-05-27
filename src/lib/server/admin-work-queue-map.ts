import type { Firestore, QueryDocumentSnapshot } from "firebase-admin/firestore";
import { resolvePlaybackUrl } from "@/lib/cloudflare/stream";
import {
  syncPromoRevisionStreamStatusIfNeeded,
  syncPromoStreamStatusIfNeeded,
  syncWorkRevisionStreamStatusIfNeeded,
  syncWorkStreamStatusIfNeeded,
} from "@/lib/server/sync-stream-status";
import { parsePromoDoc, parseWorkDoc, worksCol } from "@/lib/server/works";
import { PROMO_SHORT_DOC_ID } from "@/types/work";

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
    streamUid && streamStatus === "ready" ? await resolvePlaybackUrl(streamUid) : undefined;
  return {
    ...work,
    contentModeration: isRevision ? rev?.contentModeration : work.contentModeration,
    ...(isRevision && rev
      ? {
          title: rev.title ?? work.title,
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
  const userSnap = await db.collection("users").doc(ownerUid).get();
  const playbackUrl =
    streamUid && streamStatus === "ready" ? await resolvePlaybackUrl(streamUid) : undefined;

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
        ? await resolvePlaybackUrl(parsed.streamUid)
        : undefined;
    livePromo = {
      title: parsed.title,
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
      playbackUrl,
      description: promoDescription ?? promo.description,
      contentModeration: promoModeration,
      pendingRevision: isRevision && rev ? { contentModeration: rev.contentModeration } : undefined,
    },
    livePromo,
    work: { ...work, id: workId },
    workId,
    ownerUid,
    ownerEmail: userSnap.data()?.email ?? null,
    ownerName: userSnap.data()?.displayName ?? null,
    isRevision,
  };
}
