import { NextResponse } from "next/server";
import { jsonError, requireUser } from "@/lib/server/api-auth";
import { upsertWorkProfileNote } from "@/lib/server/work-profile-notes";
import { getDbOrNull } from "@/lib/server/works";

export async function PUT(request: Request) {
  const auth = await requireUser(request);
  if ("error" in auth) return auth.error;

  const db = await getDbOrNull();
  if (!db) return jsonError("admin_not_configured", "서버 DB를 사용할 수 없습니다.", 503);

  let body: { ownerUid?: string; workId?: string; text?: string };
  try {
    body = (await request.json()) as { ownerUid?: string; workId?: string; text?: string };
  } catch {
    return jsonError("invalid_body", "요청 본문이 올바르지 않습니다.", 400);
  }

  const ownerUid = typeof body.ownerUid === "string" ? body.ownerUid.trim() : "";
  const workId = typeof body.workId === "string" ? body.workId.trim() : "";
  const text = typeof body.text === "string" ? body.text : "";

  if (!ownerUid || !workId) {
    return jsonError("invalid_body", "ownerUid와 workId가 필요합니다.", 400);
  }

  try {
    await upsertWorkProfileNote(db, auth.session.uid, ownerUid, workId, text);
    return NextResponse.json({ ok: true, text: text.trim() || null });
  } catch {
    return jsonError("save_failed", "메모를 저장하지 못했습니다.", 500);
  }
}
