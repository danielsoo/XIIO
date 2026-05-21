import { NextResponse } from "next/server";
import {
  createTusDirectUpload,
  isStreamConfigured,
  MAX_STREAM_UPLOAD_BYTES,
} from "@/lib/cloudflare/stream";
import { hasDepositVerifiedClaim } from "@/lib/server/deposit-verification";
import { isUploaderDepositEnabled } from "@/lib/payments/config";
import { jsonError, requireUser } from "@/lib/server/api-auth";
import {
  FieldValue,
  getDbOrNull,
  nextWorkSortOrder,
  worksCol,
} from "@/lib/server/works";
import { defaultAspectRatioForSection, isVideoAspectRatio } from "@/lib/works/aspect-ratio";
import { isWorkSection } from "@/lib/works/constants";
import { parseUploadLength } from "@/lib/server/parse-upload-length";
import { normalizeContentCategory, normalizeTags } from "@/lib/works/label-utils";
import type { VideoAspectRatio } from "@/types/work";

export async function POST(request: Request) {
  if (!isStreamConfigured()) {
    return jsonError(
      "stream_not_configured",
      "Cloudflare Stream 환경 변수가 없습니다. CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_STREAM_API_TOKEN을 설정하세요.",
      503
    );
  }

  const auth = await requireUser(request);
  if ("error" in auth) return auth.error;
  const { session } = auth;

  if (isUploaderDepositEnabled()) {
    const verified = await hasDepositVerifiedClaim(session.uid);
    if (!verified) {
      return jsonError("deposit_required", "업로더 보증금 결제가 완료되지 않았습니다.", 403);
    }
  }

  let body: {
    title?: string;
    section?: string;
    category?: string;
    contentCategory?: string;
    tags?: string[];
    description?: string;
    director?: string;
    aspectRatio?: string;
    uploadLength?: number | string;
  };
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

  const sectionRaw = (body.section ?? body.category)?.trim() ?? "movies";
  if (!isWorkSection(sectionRaw)) {
    return jsonError("invalid_section", "유효하지 않은 노출 섹션입니다.", 400);
  }

  const proposedCategory = body.contentCategory
    ? normalizeContentCategory(body.contentCategory)
    : "";
  const proposedTags = normalizeTags(Array.isArray(body.tags) ? body.tags : []);

  const aspectRaw = body.aspectRatio?.trim();
  let proposedAspectRatio: VideoAspectRatio;
  if (aspectRaw && isVideoAspectRatio(aspectRaw)) {
    proposedAspectRatio = aspectRaw;
  } else if (aspectRaw) {
    return jsonError("invalid_aspect_ratio", "유효하지 않은 화면 비율입니다.", 400);
  } else {
    proposedAspectRatio = defaultAspectRatioForSection(sectionRaw);
  }

  const title = (body.title ?? "Untitled").trim().slice(0, 200) || "Untitled";
  const workId = crypto.randomUUID();

  let upload: { tusEndpoint: string; uid: string };
  try {
    upload = await createTusDirectUpload({
      uploadLength,
      meta: {
        xiio_uid: session.uid,
        xiio_work_id: workId,
        xiio_kind: "full",
        title,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[upload-url] Cloudflare Stream:", msg);
    const storageFull =
      /storage capacity exceeded|storage quota|exceeded your allocated storage/i.test(msg);
    return jsonError(
      storageFull ? "stream_storage_full" : "stream_api_failed",
      msg || "Cloudflare Stream API 호출에 실패했습니다.",
      storageFull ? 507 : 502,
      storageFull
        ? "Cloudflare 대시보드 → Stream → Videos에서 기존 영상을 삭제하거나, Plans에서 저장 용량(분)을 늘리세요."
        : "API 토큰 권한(Stream Edit)과 계정 ID를 확인하세요."
    );
  }

  const db = await getDbOrNull();
  if (db) {
    try {
      const sortOrder = await nextWorkSortOrder(db, session.uid);
      await worksCol(db, session.uid).doc(workId).set({
        kind: "full",
        section: sectionRaw,
        title,
        description: body.description?.trim() || null,
        director: body.director?.trim().slice(0, 120) || null,
        proposedCategory: proposedCategory || null,
        proposedTags: proposedTags.length > 0 ? proposedTags : null,
        proposedAspectRatio,
        platformStatus: "pending",
        streamStatus: "uploading",
        streamUid: upload.uid,
        sortOrder,
        ownerUid: session.uid,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[upload-url] Firestore:", msg);
      return jsonError(
        "firestore_write_failed",
        msg || "Firestore에 저장하지 못했습니다.",
        500,
        "FIREBASE_SERVICE_ACCOUNT_JSON, Firestore DB 이름(xiio), 보안 규칙을 확인하세요."
      );
    }
  }

  return NextResponse.json({
    workId,
    streamUid: upload.uid,
    tusEndpoint: upload.tusEndpoint,
  });
}
