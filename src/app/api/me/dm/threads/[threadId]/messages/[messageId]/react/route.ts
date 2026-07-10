import { NextResponse } from "next/server";
import { jsonError, requireUser } from "@/lib/server/api-auth";
import { reactToDmMessage } from "@/lib/server/dm";
import { getDbOrNull } from "@/lib/server/works";

type Params = { params: Promise<{ threadId: string; messageId: string }> };

export async function POST(request: Request, { params }: Params) {
  const auth = await requireUser(request);
  if ("error" in auth) return auth.error;

  const { threadId, messageId } = await params;
  const db = await getDbOrNull();
  if (!db) return jsonError("admin_not_configured", "서버 DB를 사용할 수 없습니다.", 503);

  let body: { emoji?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return jsonError("invalid_json", "요청 형식(JSON)이 올바르지 않습니다.", 400);
  }

  const result = await reactToDmMessage(db, threadId, messageId, auth.session.uid, body.emoji ?? "");
  if (!result.ok) {
    const status =
      result.code === "forbidden" ? 403 : result.code === "message_not_found" ? 404 : 400;
    return jsonError(result.code, "리액션을 처리하지 못했습니다.", status);
  }
  return NextResponse.json({ ok: true, reactions: result.reactions });
}
