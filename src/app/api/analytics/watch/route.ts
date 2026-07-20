import { NextResponse } from "next/server";
import { jsonError } from "@/lib/server/api-auth";
import { viewerKeyFromRequest } from "@/lib/server/engagement";
import { verifyBearerIdToken } from "@/lib/server/firebase-admin";
import { recordWatchHeartbeat } from "@/lib/server/platform-analytics";
import { getDbOrNull, parseWorkDoc, worksCol } from "@/lib/server/works";

type WatchHeartbeatBody = {
  ownerUid?: string;
  workId?: string;
  sessionId?: string;
  positionSec?: number;
  durationSec?: number;
  resolutionHeight?: number | null;
  isPlaying?: boolean;
};

export async function POST(request: Request) {
  const db = await getDbOrNull();
  if (!db) return jsonError("admin_not_configured", "Platform analytics is unavailable.", 503);

  let body: WatchHeartbeatBody;
  try {
    body = (await request.json()) as WatchHeartbeatBody;
  } catch {
    return jsonError("invalid_body", "Invalid watch analytics request.", 400);
  }

  const ownerUid = body.ownerUid?.trim();
  const workId = body.workId?.trim();
  const positionSec = Number(body.positionSec);
  const durationSec = Number(body.durationSec);
  if (
    !ownerUid ||
    !workId ||
    !Number.isFinite(positionSec) ||
    !Number.isFinite(durationSec) ||
    typeof body.isPlaying !== "boolean"
  ) {
    return jsonError("invalid_body", "Work and playback state are required.", 400);
  }

  const auth = await verifyBearerIdToken(request.headers.get("authorization"));
  const viewerKey = viewerKeyFromRequest(auth?.uid ?? null, body.sessionId);
  if (!viewerKey) return jsonError("invalid_viewer", "A playback session is required.", 400);

  const workSnap = await worksCol(db, ownerUid).doc(workId).get();
  if (!workSnap.exists) return jsonError("not_found", "Work not found.", 404);
  const work = parseWorkDoc(workId, workSnap.data() as Record<string, unknown>);
  if (work.platformStatus !== "published") {
    return jsonError("not_published", "This work is not published.", 404);
  }

  await recordWatchHeartbeat(db, {
    viewerKey,
    ownerUid,
    workId,
    title: work.title,
    section: work.section,
    streamUid: work.streamUid,
    positionSec: Math.max(0, positionSec),
    durationSec: Math.max(0, durationSec),
    resolutionHeight:
      typeof body.resolutionHeight === "number" && Number.isFinite(body.resolutionHeight)
        ? body.resolutionHeight
        : null,
    isPlaying: body.isPlaying,
  });
  return NextResponse.json({ ok: true });
}

