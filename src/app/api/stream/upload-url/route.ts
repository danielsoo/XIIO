import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { createDirectUpload, isStreamConfigured } from "@/lib/cloudflare/stream";
import { verifyBearerIdToken, getAdminDb } from "@/lib/server/firebase-admin";
import { hasDepositVerifiedClaim } from "@/lib/server/deposit-verification";
import { isUploaderDepositEnabled } from "@/lib/payments/config";

export async function POST(request: Request) {
  if (!isStreamConfigured()) {
    return NextResponse.json({ error: "stream_not_configured" }, { status: 503 });
  }

  const session = await verifyBearerIdToken(request.headers.get("authorization"));
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (isUploaderDepositEnabled()) {
    const verified = await hasDepositVerifiedClaim(session.uid);
    if (!verified) {
      return NextResponse.json({ error: "deposit_required" }, { status: 403 });
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

  const upload = await createDirectUpload({
    xiio_uid: session.uid,
    xiio_video_id: videoId,
    title,
  });

  const db = getAdminDb();
  if (db) {
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
  }

  return NextResponse.json({
    videoId,
    streamUid: upload.uid,
    uploadURL: upload.uploadURL,
  });
}
