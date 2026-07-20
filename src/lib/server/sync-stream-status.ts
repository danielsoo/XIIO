import type { Firestore } from "firebase-admin/firestore";
import { getStreamVideo } from "@/lib/cloudflare/stream";
import { mapWebhookStreamStatus } from "@/lib/works/constants";
import type { StreamStatus } from "@/types/work";
import { finalizePromoStreamIfReady } from "@/lib/server/promo-stream-ready";
import { finalizePrologueStreamIfReady } from "@/lib/server/prologue-stream-ready";
import { materializePromoSourceClipIfReady } from "@/lib/server/promo-source-clip";
import { FieldValue, prologueRef, promoRef, worksCol } from "@/lib/server/works";

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
  if (next === "ready") {
    await finalizePromoStreamIfReady(db, ownerUid, workId, streamUid, "promo");
  }
  return next;
}

export async function syncPromoSourceStreamStatusIfNeeded(
  db: Firestore,
  ownerUid: string,
  workId: string,
  sourceStreamUid: string,
  current: StreamStatus | undefined
): Promise<StreamStatus | undefined> {
  if (!sourceStreamUid || !current || current === "error") return current;

  const info = await getStreamVideo(sourceStreamUid);
  if (!info?.statusState) return current;

  const next = mapWebhookStreamStatus(info.statusState);
  await promoRef(db, ownerUid, workId).set(
    {
      sourceStreamStatus: next,
      streamStatus: next === "error" ? "error" : "processing",
      ...(next === "error" ? { streamError: "promo_source_upload_failed" } : {}),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
  if (next === "ready") {
    await materializePromoSourceClipIfReady(db, ownerUid, workId, sourceStreamUid);
  }
  return next;
}

export async function syncPromoRevisionStreamStatusIfNeeded(
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
    "pendingRevision.streamStatus": next,
    "pendingRevision.updatedAt": FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  if (next === "ready") {
    await finalizePromoStreamIfReady(db, ownerUid, workId, streamUid, "promo_revision");
  }
  return next;
}

export async function syncPrologueStreamStatusIfNeeded(
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

  await prologueRef(db, ownerUid, workId).update({
    streamStatus: next,
    updatedAt: FieldValue.serverTimestamp(),
  });
  if (next === "ready") {
    await finalizePrologueStreamIfReady(db, ownerUid, workId, streamUid, "prologue");
  }
  return next;
}

export async function syncPrologueRevisionStreamStatusIfNeeded(
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

  await prologueRef(db, ownerUid, workId).update({
    "pendingRevision.streamStatus": next,
    "pendingRevision.updatedAt": FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  if (next === "ready") {
    await finalizePrologueStreamIfReady(db, ownerUid, workId, streamUid, "prologue_revision");
  }
  return next;
}

export async function syncWorkRevisionStreamStatusIfNeeded(
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

  await worksCol(db, ownerUid).doc(workId).update({
    "pendingRevision.streamStatus": next,
    "pendingRevision.updatedAt": FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  return next;
}
