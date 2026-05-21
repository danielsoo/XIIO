import type { Firestore } from "firebase-admin/firestore";
import { getStreamVideo } from "@/lib/cloudflare/stream";
import { applyPromoClipToWork } from "@/lib/server/apply-promo-clip";
import { parsePromoDoc, parseWorkDoc, promoRef, worksCol } from "@/lib/server/works";
import { validatePromoClipRange } from "@/lib/works/promo-clip";
import { FieldValue } from "@/lib/server/works";

/** 본편 인코딩 완료 후 promoDraft → Cloudflare 클립 + promo 문서 */
export async function materializePromoFromDraft(
  db: Firestore,
  ownerUid: string,
  workId: string
): Promise<"created" | "skipped" | "failed"> {
  const workRef = worksCol(db, ownerUid).doc(workId);
  const workSnap = await workRef.get();
  if (!workSnap.exists) return "skipped";

  const work = parseWorkDoc(workId, workSnap.data() as Record<string, unknown>);
  if (!work.promoDraft) return "skipped";
  if (work.streamStatus !== "ready" || !work.streamUid) return "skipped";

  const promoSnap = await promoRef(db, ownerUid, workId).get();
  if (promoSnap.exists) {
    const promo = parsePromoDoc(promoSnap.data() as Record<string, unknown>);
    if (promo.streamUid) return "skipped";
  }

  const draft = work.promoDraft;
  const fullInfo = await getStreamVideo(work.streamUid);
  const duration = fullInfo?.duration ?? 600;
  const clipErr = validatePromoClipRange(draft.clipStartSec, draft.clipEndSec, duration);
  if (clipErr) {
    console.warn("[materialize-promo-draft] invalid clip:", workId, clipErr);
    return "failed";
  }

  try {
    await applyPromoClipToWork(db, ownerUid, workId, work.streamUid, {
      clipStartSec: draft.clipStartSec,
      clipEndSec: draft.clipEndSec,
      title: draft.title,
      description: draft.description,
    }, { mergeExisting: promoSnap.exists });

    await workRef.update({
      promoDraft: FieldValue.delete(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return "created";
  } catch (e) {
    console.error("[materialize-promo-draft]", workId, e);
    return "failed";
  }
}
