import type { Firestore } from "firebase-admin/firestore";
import { createClip } from "@/lib/cloudflare/stream";
import { validatePromoClipRange } from "@/lib/works/promo-clip";
import { FieldValue, promoRef } from "@/lib/server/works";

export type PromoClipInput = {
  clipStartSec: number;
  clipEndSec: number;
  title: string;
  description?: string | null;
};

/** 신규 홍보 쇼츠 클립 생성 (draft, processing) */
export async function applyPromoClipToWork(
  db: Firestore,
  ownerUid: string,
  workId: string,
  fullStreamUid: string,
  clip: PromoClipInput,
  options?: { mergeExisting?: boolean }
): Promise<{ streamUid: string }> {
  const err = validatePromoClipRange(clip.clipStartSec, clip.clipEndSec);
  if (err) {
    throw new Error(err);
  }

  const created = await createClip({
    clippedFromVideoUID: fullStreamUid,
    startTimeSeconds: clip.clipStartSec,
    endTimeSeconds: clip.clipEndSec,
    meta: {
      xiio_uid: ownerUid,
      xiio_work_id: workId,
      xiio_kind: "promo",
    },
  });

  const promoDocRef = promoRef(db, ownerUid, workId);
  const existing = await promoDocRef.get();

  await promoDocRef.set(
    {
      platformStatus: "draft",
      streamStatus: "processing",
      streamUid: created.uid,
      clipStartSec: clip.clipStartSec,
      clipEndSec: clip.clipEndSec,
      title: clip.title.trim().slice(0, 200),
      description: clip.description?.trim() || null,
      updatedAt: FieldValue.serverTimestamp(),
      ...(existing.exists && options?.mergeExisting ? {} : { createdAt: FieldValue.serverTimestamp() }),
    },
    { merge: true }
  );

  return { streamUid: created.uid };
}
