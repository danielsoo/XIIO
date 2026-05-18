import type { Firestore } from "firebase-admin/firestore";
import { getStreamVideo } from "@/lib/cloudflare/stream";
import { mapWebhookStreamStatus } from "@/lib/works/constants";
import type { StreamStatus } from "@/types/work";
import { FieldValue, promoRef, worksCol } from "@/lib/server/works";

/** Firestore streamStatus가 uploading/processing일 때 Cloudflare API로 실제 상태 반영 */
export async function syncWorkStreamStatusIfNeeded(
  db: Firestore,
  ownerUid: string,
  workId: string,
  streamUid: string,
  current: StreamStatus
): Promise<StreamStatus> {
  if (!streamUid || current === "ready" || current === "error") return current;

  const info = await getStreamVideo(streamUid);
  if (!info?.statusState) return current;

  const next = mapWebhookStreamStatus(info.statusState);
  if (next === current) return current;

  await worksCol(db, ownerUid).doc(workId).update({
    streamStatus: next,
    updatedAt: FieldValue.serverTimestamp(),
  });
  return next;
}

export async function syncPromoStreamStatusIfNeeded(
  db: Firestore,
  ownerUid: string,
  workId: string,
  streamUid: string,
  current: StreamStatus | undefined
): Promise<StreamStatus | undefined> {
  if (!streamUid || !current || current === "ready" || current === "error") return current;

  const info = await getStreamVideo(streamUid);
  if (!info?.statusState) return current;

  const next = mapWebhookStreamStatus(info.statusState);
  if (next === current) return current;

  await promoRef(db, ownerUid, workId).update({
    streamStatus: next,
    updatedAt: FieldValue.serverTimestamp(),
  });
  return next;
}
