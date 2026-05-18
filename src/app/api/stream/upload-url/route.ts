import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { createDirectUpload, isStreamConfigured } from "@/lib/cloudflare/stream";
import { getFirebaseAdminApp, verifyBearerIdToken, getAdminDb } from "@/lib/server/firebase-admin";
import { hasDepositVerifiedClaim } from "@/lib/server/deposit-verification";
import { isUploaderDepositEnabled } from "@/lib/payments/config";

function jsonError(
  error: string,
  message: string,
  status: number,
  detail?: string
) {
  return NextResponse.json(
    { error, message, ...(detail ? { detail } : {}) },
    { status }
  );
}

export async function POST(request: Request) {
  if (!isStreamConfigured()) {
    return jsonError(
      "stream_not_configured",
      "Cloudflare Stream 환경 변수가 없습니다. CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_STREAM_API_TOKEN을 설정하세요.",
      503
    );
  }

  if (!getFirebaseAdminApp()) {
    return jsonError(
      "admin_not_configured",
      "서버 Firebase Admin이 설정되지 않았습니다. FIREBASE_SERVICE_ACCOUNT_JSON을 확인하세요.",
      503
    );
  }

  const session = await verifyBearerIdToken(request.headers.get("authorization"));
  if (!session) {
    return jsonError(
      "unauthorized",
      "로그인이 만료되었거나 인증에 실패했습니다. 다시 로그인해 주세요.",
      401
    );
  }

  if (isUploaderDepositEnabled()) {
    const verified = await hasDepositVerifiedClaim(session.uid);
    if (!verified) {
      return jsonError(
        "deposit_required",
        "업로더 보증금 결제가 완료되지 않았습니다.",
        403
      );
    }
  }

  let body: { title?: string };
  try {
    body = (await request.json()) as { title?: string };
  } catch {
    body = {};
  }

  const title = (body.title ?? "Untitled").trim().slice(0, 200) || "Untitled";
  const videoId = crypto.randomUUID();

  let upload: { uploadURL: string; uid: string };
  try {
    upload = await createDirectUpload({
      xiio_uid: session.uid,
      xiio_video_id: videoId,
      title,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[upload-url] Cloudflare Stream:", msg);
    return jsonError(
      "stream_api_failed",
      msg || "Cloudflare Stream API 호출에 실패했습니다.",
      502,
      "API 토큰 권한(Stream Edit)과 계정 ID를 확인하세요."
    );
  }

  const db = getAdminDb();
  if (db) {
    try {
      await db
        .collection("users")
        .doc(session.uid)
        .collection("videos")
        .doc(videoId)
        .set({
          title,
          streamUid: upload.uid,
          status: "uploading",
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[upload-url] Firestore:", msg);
      return jsonError(
        "firestore_write_failed",
        msg || "Firestore에 영상 정보를 저장하지 못했습니다.",
        500,
        "FIREBASE_SERVICE_ACCOUNT_JSON, Firestore DB 이름(xiio), 보안 규칙을 확인하세요."
      );
    }
  }

  return NextResponse.json({
    videoId,
    streamUid: upload.uid,
    uploadURL: upload.uploadURL,
  });
}
