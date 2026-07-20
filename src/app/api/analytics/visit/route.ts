import { NextResponse } from "next/server";
import { jsonError } from "@/lib/server/api-auth";
import { verifyBearerIdToken } from "@/lib/server/firebase-admin";
import { recordPlatformVisit, type TrafficSource } from "@/lib/server/platform-analytics";
import { getDbOrNull } from "@/lib/server/works";

const SOURCES = new Set<TrafficSource>(["discover", "direct", "search", "schools", "external"]);

export async function POST(request: Request) {
  const db = await getDbOrNull();
  if (!db) return jsonError("admin_not_configured", "Platform analytics is unavailable.", 503);

  let body: { sessionId?: string; source?: string };
  try {
    body = (await request.json()) as { sessionId?: string; source?: string };
  } catch {
    return jsonError("invalid_body", "Invalid analytics request.", 400);
  }

  const sessionId = body.sessionId?.trim();
  const source = body.source as TrafficSource;
  if (!sessionId || sessionId.length < 8 || sessionId.length > 128 || !SOURCES.has(source)) {
    return jsonError("invalid_body", "A valid session and traffic source are required.", 400);
  }

  const session = await verifyBearerIdToken(request.headers.get("authorization"));
  const recorded = await recordPlatformVisit(db, {
    sessionId,
    source,
    uid: session?.uid ?? null,
  });
  return NextResponse.json({ ok: true, recorded });
}

