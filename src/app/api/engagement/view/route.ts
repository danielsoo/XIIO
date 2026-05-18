import { NextResponse } from "next/server";
import { jsonError } from "@/lib/server/api-auth";
import { recordView, viewerKeyFromRequest } from "@/lib/server/engagement";
import { verifyBearerIdToken } from "@/lib/server/firebase-admin";
import { getDbOrNull } from "@/lib/server/works";
import type { EngagementTarget, ViewBody } from "@/types/engagement";

function isTarget(v: unknown): v is EngagementTarget {
  return v === "promo" || v === "full";
}

export async function POST(request: Request) {
  const db = await getDbOrNull();
  if (!db) return jsonError("admin_not_configured", "서버 DB를 사용할 수 없습니다.", 503);

  let body: ViewBody;
  try {
    body = (await request.json()) as ViewBody;
  } catch {
    return jsonError("invalid_body", "요청 형식이 올바르지 않습니다.", 400);
  }

  const { ownerUid, workId, target, sessionId } = body;
  if (!ownerUid || !workId || !isTarget(target)) {
    return jsonError("invalid_body", "ownerUid, workId, target가 필요합니다.", 400);
  }

  const session = await verifyBearerIdToken(request.headers.get("authorization"));
  const viewerKey = viewerKeyFromRequest(session?.uid ?? null, sessionId);
  if (!viewerKey) {
    return jsonError("invalid_viewer", "sessionId가 필요합니다.", 400);
  }

  const result = await recordView(db, ownerUid, workId, target, viewerKey);
  if (!result.ok) {
    if (result.error === "not_found") {
      return jsonError("not_found", "작품을 찾을 수 없습니다.", 404);
    }
    return jsonError("not_published", "공개된 작품이 아닙니다.", 404);
  }

  return NextResponse.json({ ok: true, recorded: result.recorded });
}
