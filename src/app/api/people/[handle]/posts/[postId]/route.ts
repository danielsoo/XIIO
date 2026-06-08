import { NextResponse } from "next/server";
import { jsonError, requireUser } from "@/lib/server/api-auth";
import { resolveDiscoverableProfileByHandle } from "@/lib/server/people-handle";
import { deleteProfilePost, updateProfilePost } from "@/lib/server/profile-posts";
import { getDbOrNull } from "@/lib/server/works";

type Params = { params: Promise<{ handle: string; postId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireUser(request);
  if ("error" in auth) return auth.error;

  const { handle, postId } = await params;
  const db = await getDbOrNull();
  if (!db) return jsonError("admin_not_configured", "서버 DB를 사용할 수 없습니다.", 503);

  const resolved = await resolveDiscoverableProfileByHandle(db, handle);
  if (!resolved) return jsonError("not_found", "프로필을 찾을 수 없습니다.", 404);
  if (resolved.uid !== auth.session.uid) {
    return jsonError("forbidden", "본인 글만 수정할 수 있습니다.", 403);
  }

  let body: { text?: string };
  try {
    body = (await request.json()) as { text?: string };
  } catch {
    return jsonError("invalid_body", "요청 본문이 올바르지 않습니다.", 400);
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) return jsonError("empty_text", "내용을 입력해 주세요.", 400);

  try {
    const post = await updateProfilePost(db, resolved.uid, postId, text);
    if (!post) return jsonError("not_found", "글을 찾을 수 없습니다.", 404);
    return NextResponse.json({ post });
  } catch {
    return jsonError("update_failed", "글을 수정하지 못했습니다.", 500);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const auth = await requireUser(_request);
  if ("error" in auth) return auth.error;

  const { handle, postId } = await params;
  const db = await getDbOrNull();
  if (!db) return jsonError("admin_not_configured", "서버 DB를 사용할 수 없습니다.", 503);

  const resolved = await resolveDiscoverableProfileByHandle(db, handle);
  if (!resolved) return jsonError("not_found", "프로필을 찾을 수 없습니다.", 404);
  if (resolved.uid !== auth.session.uid) {
    return jsonError("forbidden", "본인 글만 삭제할 수 있습니다.", 403);
  }

  const ok = await deleteProfilePost(db, resolved.uid, postId);
  if (!ok) return jsonError("not_found", "글을 찾을 수 없습니다.", 404);
  return NextResponse.json({ ok: true });
}
