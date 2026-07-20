import type { Firestore } from "firebase-admin/firestore";
import { createClip, getStreamVideo } from "@/lib/cloudflare/stream";
import { FieldValue, promoRef } from "@/lib/server/works";
import { validatePromoClipRange } from "@/lib/works/promo-clip";
import { validatePromoVideoDimensions } from "@/lib/works/promo-video";

type ClaimedClip = {
  start: number;
  end: number;
};

/**
 * Turn a separately uploaded long promo source into the final <=120 second Stream video.
 * The Firestore claim prevents the webhook and polling fallback from creating duplicate clips.
 */
export async function materializePromoSourceClipIfReady(
  db: Firestore,
  ownerUid: string,
  workId: string,
  sourceStreamUid: string
): Promise<void> {
  const info = await getStreamVideo(sourceStreamUid);
  if (!info || info.statusState !== "ready") return;

  const dimensionError = validatePromoVideoDimensions(info.width ?? 0, info.height ?? 0);
  if (dimensionError) {
    await promoRef(db, ownerUid, workId).set(
      {
        sourceStreamStatus: "error",
        sourceClipStatus: "error",
        streamStatus: "error",
        streamError:
          dimensionError === "too_small" ? "promo_too_small" : "promo_invalid_dimensions",
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    return;
  }

  const ref = promoRef(db, ownerUid, workId);
  const claimed = await db.runTransaction<ClaimedClip | null>(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return null;
    const raw = snap.data() as Record<string, unknown>;
    if (raw.sourceStreamUid !== sourceStreamUid) return null;
    if (typeof raw.streamUid === "string" && raw.streamUid.trim()) return null;
    if (raw.sourceClipStatus === "creating" || raw.sourceClipStatus === "processing") return null;

    const start = typeof raw.sourceClipStartSec === "number" ? raw.sourceClipStartSec : NaN;
    const end = typeof raw.sourceClipEndSec === "number" ? raw.sourceClipEndSec : NaN;
    const rangeError = validatePromoClipRange(start, end, info.duration);
    if (rangeError) {
      tx.set(
        ref,
        {
          sourceStreamStatus: "error",
          sourceClipStatus: "error",
          streamStatus: "error",
          streamError: `promo_${rangeError}`,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      return null;
    }

    tx.set(
      ref,
      {
        sourceStreamStatus: "ready",
        sourceClipStatus: "creating",
        streamStatus: "processing",
        streamError: FieldValue.delete(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    return { start, end };
  });

  if (!claimed) return;

  try {
    const created = await createClip({
      clippedFromVideoUID: sourceStreamUid,
      startTimeSeconds: claimed.start,
      endTimeSeconds: claimed.end,
      meta: {
        xiio_uid: ownerUid,
        xiio_work_id: workId,
        xiio_kind: "promo",
      },
    });

    await ref.set(
      {
        streamUid: created.uid,
        streamStatus: "processing",
        sourceClipStatus: "processing",
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    await ref.set(
      {
        sourceClipStatus: "error",
        streamStatus: "error",
        streamError: "promo_clip_creation_failed",
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    throw error;
  }
}
