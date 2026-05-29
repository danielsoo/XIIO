import { NextResponse } from "next/server";
import {
  createTusDirectUpload,
  deleteStreamVideo,
  isStreamConfigured,
  MAX_STREAM_UPLOAD_BYTES,
} from "@/lib/cloudflare/stream";
import { hasDepositVerifiedClaim } from "@/lib/server/deposit-verification";
import { isUploaderDepositEnabled } from "@/lib/payments/config";
import { jsonError, requireUser } from "@/lib/server/api-auth";
import { parseUploadLength } from "@/lib/server/parse-upload-length";
import { normalizePromoFrameCrop } from "@/lib/works/promo-crop";
import {
  FieldValue,
  getDbOrNull,
  parsePromoDoc,
  parseWorkDoc,
  promoRef,
  worksCol,
} from "@/lib/server/works";

type Params = { params: Promise<{ workId: string }> };

export async function POST(request: Request, { params }: Params) {
  if (!isStreamConfigured()) {
    return jsonError("stream_not_configured", "Cloudflare Stream이 설정되지 않았습니다.", 503);
  }

  const auth = await requireUser(request);
  if ("error" in auth) return auth.error;
  const { session } = auth;
  const { workId } = await params;

  let body: { uploadLength?: number | string; revision?: boolean; frameCrop?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return jsonError("invalid_json", "요청 형식(JSON)이 올바르지 않습니다.", 400);
  }

  const uploadLength = parseUploadLength(body.uploadLength);
  const frameCrop = normalizePromoFrameCrop(body.frameCrop);
  if (uploadLength == null || uploadLength <= 0) {
    return jsonError("invalid_body", "파일 크기(uploadLength)가 필요합니다.", 400);
  }
  if (uploadLength > MAX_STREAM_UPLOAD_BYTES) {
    return jsonError("invalid_body", "파일이 너무 큽니다. (최대 30GB)", 400);
  }

  if (isUploaderDepositEnabled()) {
    const verified = await hasDepositVerifiedClaim(session.uid);
    if (!verified) {
      return jsonError("deposit_required", "업로더 보증금 결제가 완료되지 않았습니다.", 403);
    }
  }

  const db = await getDbOrNull();
  if (!db) return jsonError("admin_not_configured", "서버 DB를 사용할 수 없습니다.", 503);

  const workSnap = await worksCol(db, session.uid).doc(workId).get();
  if (!workSnap.exists) return jsonError("not_found", "작품을 찾을 수 없습니다.", 404);

  const work = parseWorkDoc(workId, workSnap.data() as Record<string, unknown>);
  const promoSnap = await promoRef(db, session.uid, workId).get();
  const existing = promoSnap.exists
    ? parsePromoDoc(promoSnap.data() as Record<string, unknown>)
    : null;

  const isRevision = Boolean(body.revision) || existing?.platformStatus === "published";

  if (work.platformStatus === "draft" && !isRevision) {
    return jsonError(
      "use_staging",
      "초안 작품은 영상을 스테이징에 저장한 뒤 심사 제출 시 인코딩됩니다.",
      400
    );
  }

  if (isRevision) {
    if (existing?.platformStatus !== "published") {
      return jsonError("invalid_state", "게시된 쇼츠만 수정본 영상을 올릴 수 있습니다.", 400);
    }
    if (existing.revisionReviewStatus === "pending") {
      return jsonError("revision_pending", "수정본 심사가 끝난 후 다시 업로드할 수 있습니다.", 403);
    }
  } else if (existing?.platformStatus === "pending") {
    return jsonError("promo_locked", "심사 중인 쇼츠 영상은 교체할 수 없습니다.", 403);
  }

  const oldUid = isRevision
    ? existing?.pendingRevision?.streamUid
    : existing?.streamUid;
  if (oldUid) {
    try {
      await deleteStreamVideo(oldUid);
    } catch {
      /* ignore */
    }
  }

  const streamKind = isRevision ? "promo_revision" : "promo";
  const promoTitle =
    existing?.title ?? work.promoDraft?.title ?? work.title;

  let upload: { tusEndpoint: string; uid: string };
  try {
    upload = await createTusDirectUpload({
      uploadLength,
      meta: {
        xiio_uid: session.uid,
        xiio_work_id: workId,
        xiio_kind: streamKind,
        title: promoTitle,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return jsonError("stream_api_failed", msg, 502);
  }

  const promoDocRef = promoRef(db, session.uid, workId);

  if (isRevision) {
    await promoDocRef.set(
      {
        pendingRevision: {
          platformStatus: "draft",
          streamUid: upload.uid,
          streamStatus: "uploading",
          title: existing?.title,
          description: existing?.description,
          thumbnailUrl: existing?.thumbnailUrl ?? work.promoDraft?.thumbnailUrl ?? null,
          frameCrop,
          clipStartSec: 0,
          clipEndSec: 0,
          updatedAt: FieldValue.serverTimestamp(),
        },
        revisionReviewStatus: FieldValue.delete(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  } else {
    const draft = work.promoDraft;
    await promoDocRef.set(
      {
        platformStatus: "draft",
        streamUid: upload.uid,
        streamStatus: "uploading",
        title: draft?.title ?? existing?.title ?? work.title,
        description: draft?.description ?? existing?.description ?? work.description ?? null,
        thumbnailUrl:
          draft?.thumbnailUrl ?? existing?.thumbnailUrl ?? null,
        frameCrop,
        clipStartSec: 0,
        clipEndSec: 0,
        streamError: FieldValue.delete(),
        updatedAt: FieldValue.serverTimestamp(),
        ...(promoSnap.exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
      },
      { merge: true }
    );
  }

  return NextResponse.json({
    workId,
    streamUid: upload.uid,
    tusEndpoint: upload.tusEndpoint,
    revisionMode: isRevision,
  });
}
