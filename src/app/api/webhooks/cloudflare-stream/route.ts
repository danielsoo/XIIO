import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/server/firebase-admin";

export const runtime = "nodejs";

type StreamWebhookPayload = {
  uid?: string;
  status?: { state?: string };
  meta?: Record<string, string>;
};

export async function POST(request: Request) {
  const secret = process.env.CLOUDFLARE_STREAM_WEBHOOK_SECRET;
  if (secret) {
    const header = request.headers.get("webhook-signature") ?? request.headers.get("x-webhook-signature");
    if (header !== secret) {
      return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
    }
  }

  let payload: StreamWebhookPayload;
  try {
    payload = (await request.json()) as StreamWebhookPayload;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const streamUid = payload.uid;
  const meta = payload.meta ?? {};
  const xiioUid = meta.xiio_uid;
  const videoId = meta.xiio_video_id;
  const state = payload.status?.state;

  if (!streamUid || !xiioUid || !videoId) {
    return NextResponse.json({ received: true, handled: false });
  }

  const db = getAdminDb();
  if (!db) {
    return NextResponse.json({ error: "admin_not_configured" }, { status: 503 });
  }

  const status =
    state === "ready" ? "ready" : state === "error" ? "error" : state === "pendingupload" ? "uploading" : state ?? "processing";

  await db
    .collection("users")
    .doc(xiioUid)
    .collection("videos")
    .doc(videoId)
    .set(
      {
        streamUid,
        status,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

  return NextResponse.json({ received: true, handled: true, status });
}
