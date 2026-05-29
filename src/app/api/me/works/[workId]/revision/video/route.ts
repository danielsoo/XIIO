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
import { FieldValue, getDbOrNull, parseWorkDoc, worksCol } from "@/lib/server/works";

type Params = { params: Promise<{ workId: string }> };

export async function POST(request: Request, { params }: Params) {
  if (!isStreamConfigured()) {
    return jsonError("stream_not_configured", "Cloudflare Stream이 설정되지 않았습니다.", 503);
  }

  const auth = await requireUser(request);
  if ("error" in auth) return auth.error;
  const { session } = auth;
  const { workId } = await params;

  let body: { uploadLength?: number | string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return jsonError("invalid_json", "요청 형식(JSON)이 올바르지 않습니다.", 400);
  }

  const uploadLength = parseUploadLength(body.uploadLength);
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

  const ref = worksCol(db, session.uid).doc(workId);
  const snap = await ref.get();
  if (!snap.exists) return jsonError("not_found", "작품을 찾을 수 없습니다.", 404);

  const work = parseWorkDoc(workId, snap.data() as Record<string, unknown>);
  if (work.platformStatus !== "published") {
    return jsonError("invalid_state", "게시된 작품만 영상을 교체할 수 있습니다.", 400);
  }
  if (work.revisionReviewStatus === "pending") {
    return jsonError("revision_pending", "수정본 심사가 끝난 후 다시 편집할 수 있습니다.", 403);
  }

  const oldRevUid = work.pendingRevision?.streamUid;
  if (oldRevUid) {
    try {
      await deleteStreamVideo(oldRevUid);
    } catch {
      /* ignore */
    }
  }

  let upload: { tusEndpoint: string; uid: string };
  try {
    upload = await createTusDirectUpload({
      uploadLength,
      meta: {
        xiio_uid: session.uid,
        xiio_work_id: workId,
        xiio_kind: "full_revision",
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return jsonError("stream_api_failed", msg, 502);
  }

  const rev = work.pendingRevision;
  await ref.update({
    pendingRevision: {
      platformStatus: "draft",
      streamUid: upload.uid,
      streamStatus: "uploading",
      section: rev?.section ?? work.section,
      title: rev?.title ?? work.title,
      description: rev?.description ?? work.description,
      director: rev?.director ?? work.director,
      proposedCategory: rev?.proposedCategory ?? work.approvedCategory ?? work.proposedCategory,
      proposedTags: rev?.proposedTags ?? work.approvedTags ?? work.proposedTags,
      proposedAspectRatio:
        rev?.proposedAspectRatio ?? work.approvedAspectRatio ?? work.proposedAspectRatio,
      updatedAt: FieldValue.serverTimestamp(),
    },
    revisionReviewStatus: FieldValue.delete(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({
    workId,
    streamUid: upload.uid,
    tusEndpoint: upload.tusEndpoint,
  });
}
