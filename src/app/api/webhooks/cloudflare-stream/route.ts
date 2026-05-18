import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/server/firebase-admin";
import { mapWebhookStreamStatus } from "@/lib/works/constants";
import { FieldValue, promoRef, worksCol } from "@/lib/server/works";
import { PROMO_SHORT_DOC_ID } from "@/types/work";

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
  const workId = meta.xiio_work_id ?? meta.xiio_video_id;
  const kind = meta.xiio_kind ?? "full";
  const streamStatus = mapWebhookStreamStatus(payload.status?.state);

  if (!streamUid || !xiioUid || !workId) {
    return NextResponse.json({ received: true, handled: false });
  }

  const db = getAdminDb();
  if (!db) {
    return NextResponse.json({ error: "admin_not_configured" }, { status: 503 });
  }

  if (kind === "promo") {
    await promoRef(db, xiioUid, workId).set(
      {
        streamUid,
        streamStatus,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  } else {
    await worksCol(db, xiioUid).doc(workId).set(
      {
        streamUid,
        streamStatus,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  }

  return NextResponse.json({ received: true, handled: true, streamStatus, kind, workId });
}
