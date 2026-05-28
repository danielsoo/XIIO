import type { Firestore } from "firebase-admin/firestore";
import { getStreamVideo } from "@/lib/cloudflare/stream";
import {
  validatePromoVideoDimensions,
  validatePromoVideoDuration,
} from "@/lib/works/promo-video";
import { FieldValue, promoRef } from "@/lib/server/works";

/** After promo stream is ready, validate source dimensions + duration and update promo doc */
export async function finalizePromoStreamIfReady(
  db: Firestore,
  ownerUid: string,
  workId: string,
  streamUid: string,
  target: "promo" | "promo_revision"
): Promise<void> {
  const info = await getStreamVideo(streamUid);
  if (!info) return;

  const duration = info.duration ?? 0;
  const width = info.width ?? 0;
  const height = info.height ?? 0;
  const aspectErr = validatePromoVideoDimensions(width, height);
  const durationErr = validatePromoVideoDuration(duration);

  const ref = promoRef(db, ownerUid, workId);
  const prefix = target === "promo_revision" ? "pendingRevision." : "";

  if (aspectErr || durationErr) {
    const reason = aspectErr ?? durationErr ?? "invalid";
    await ref.set(
      {
        [`${prefix}streamStatus`]: "error",
        [`${prefix}streamError`]:
          aspectErr === "too_small"
            ? "promo_too_small"
            : aspectErr === "invalid_dimensions"
              ? "promo_invalid_dimensions"
              : durationErr === "too_short"
                ? "promo_too_short"
                : durationErr === "too_long"
                  ? "promo_too_long"
                  : "promo_invalid",
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    return;
  }

  const clipEnd = duration;
  const update: Record<string, unknown> = {
    [`${prefix}streamStatus`]: "ready",
    [`${prefix}streamError`]: FieldValue.delete(),
    [`${prefix}clipStartSec`]: 0,
    [`${prefix}clipEndSec`]: clipEnd,
    [`${prefix}durationSec`]: clipEnd,
    updatedAt: FieldValue.serverTimestamp(),
  };
  if (target === "promo") {
    update.durationSec = clipEnd;
    update.clipStartSec = 0;
    update.clipEndSec = clipEnd;
    update.streamError = FieldValue.delete();
  }

  await ref.set(update, { merge: true });
}
