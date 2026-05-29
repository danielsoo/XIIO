import { createTusDirectUpload, deleteStreamVideo, isStreamConfigured } from "@/lib/cloudflare/stream";
import { FieldValue, type Firestore } from "firebase-admin/firestore";
import { parseWorkDoc, prologueRef, promoRef, worksCol } from "@/lib/server/works";
import { normalizePromoFrameCrop } from "@/lib/works/promo-crop";
import { hasCompleteVideoStaging } from "@/lib/works/work-staging-ready";
import type { PromoFrameCrop } from "@/types/work";

export async function beginFullStreamUpload(
  db: Firestore,
  uid: string,
  workId: string
): Promise<{ tusEndpoint: string; streamUid: string; uploadLength: number }> {
  if (!isStreamConfigured()) throw new Error("stream_not_configured");

  const workSnap = await worksCol(db, uid).doc(workId).get();
  if (!workSnap.exists) throw new Error("not_found");
  const work = parseWorkDoc(workId, workSnap.data() as Record<string, unknown>);
  if (work.platformStatus !== "draft") throw new Error("invalid_state");
  if (!hasCompleteVideoStaging(work.videoStaging)) throw new Error("staging_incomplete");

  const uploadLength = work.videoStaging.fullBytes;
  if (!uploadLength || uploadLength <= 0) throw new Error("staging_bytes_missing");

  if (work.streamUid) {
    try {
      await deleteStreamVideo(work.streamUid);
    } catch {
      /* ignore */
    }
  }

  const upload = await createTusDirectUpload({
    uploadLength,
    meta: {
      xiio_uid: uid,
      xiio_work_id: workId,
      xiio_kind: "full",
    },
  });

  await worksCol(db, uid).doc(workId).update({
    streamUid: upload.uid,
    streamStatus: "uploading",
    updatedAt: FieldValue.serverTimestamp(),
  });

  return { tusEndpoint: upload.tusEndpoint, streamUid: upload.uid, uploadLength };
}

export async function beginPromoStreamUpload(
  db: Firestore,
  uid: string,
  workId: string,
  frameCrop: PromoFrameCrop
): Promise<{ tusEndpoint: string; streamUid: string; uploadLength: number }> {
  if (!isStreamConfigured()) throw new Error("stream_not_configured");

  const workSnap = await worksCol(db, uid).doc(workId).get();
  if (!workSnap.exists) throw new Error("not_found");
  const work = parseWorkDoc(workId, workSnap.data() as Record<string, unknown>);
  if (!hasCompleteVideoStaging(work.videoStaging)) throw new Error("staging_incomplete");

  const uploadLength = work.videoStaging.promoBytes;
  if (!uploadLength || uploadLength <= 0) throw new Error("staging_bytes_missing");

  const promoSnap = await promoRef(db, uid, workId).get();
  const promoDocRef = promoRef(db, uid, workId);
  const existing = promoSnap.exists
    ? (promoSnap.data() as Record<string, unknown>)
    : null;
  const oldUid = existing?.streamUid as string | undefined;
  if (oldUid) {
    try {
      await deleteStreamVideo(oldUid);
    } catch {
      /* ignore */
    }
  }

  const crop = normalizePromoFrameCrop(frameCrop);

  const upload = await createTusDirectUpload({
    uploadLength,
    meta: {
      xiio_uid: uid,
      xiio_work_id: workId,
      xiio_kind: "promo",
    },
  });

  const draft = work.promoDraft;
  await promoDocRef.set(
    {
      platformStatus: "draft",
      streamUid: upload.uid,
      streamStatus: "uploading",
      title: draft?.title ?? work.title,
      description: draft?.description ?? work.description ?? null,
      thumbnailUrl: draft?.thumbnailUrl ?? null,
      frameCrop: crop,
      clipStartSec: 0,
      clipEndSec: 0,
      streamError: FieldValue.delete(),
      updatedAt: FieldValue.serverTimestamp(),
      ...(promoSnap.exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
    },
    { merge: true }
  );

  return { tusEndpoint: upload.tusEndpoint, streamUid: upload.uid, uploadLength };
}

export async function beginPrologueStreamUpload(
  db: Firestore,
  uid: string,
  workId: string
): Promise<{ tusEndpoint: string; streamUid: string; uploadLength: number }> {
  if (!isStreamConfigured()) throw new Error("stream_not_configured");

  const workSnap = await worksCol(db, uid).doc(workId).get();
  if (!workSnap.exists) throw new Error("not_found");
  const work = parseWorkDoc(workId, workSnap.data() as Record<string, unknown>);
  if (!hasCompleteVideoStaging(work.videoStaging)) throw new Error("staging_incomplete");

  const prologuePath = work.videoStaging?.prologuePath?.trim();
  const uploadLength = work.videoStaging?.prologueBytes;
  if (!prologuePath || !uploadLength || uploadLength <= 0) {
    throw new Error("prologue_staging_missing");
  }

  const prologueDocRef = prologueRef(db, uid, workId);
  const prologueSnap = await prologueDocRef.get();
  const existing = prologueSnap.exists ? (prologueSnap.data() as Record<string, unknown>) : null;
  const oldUid = existing?.streamUid as string | undefined;
  if (oldUid) {
    try {
      await deleteStreamVideo(oldUid);
    } catch {
      /* ignore */
    }
  }

  const upload = await createTusDirectUpload({
    uploadLength,
    meta: {
      xiio_uid: uid,
      xiio_work_id: workId,
      xiio_kind: "prologue",
    },
  });

  const draft = work.prologueDraft;
  await prologueDocRef.set(
    {
      platformStatus: "draft",
      streamUid: upload.uid,
      streamStatus: "uploading",
      title: draft?.title ?? work.title,
      description: draft?.description ?? work.description ?? null,
      streamError: FieldValue.delete(),
      updatedAt: FieldValue.serverTimestamp(),
      ...(prologueSnap.exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
    },
    { merge: true }
  );

  return { tusEndpoint: upload.tusEndpoint, streamUid: upload.uid, uploadLength };
}
