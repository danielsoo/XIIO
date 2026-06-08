import { NextResponse } from "next/server";
import { jsonError, requireUser } from "@/lib/server/api-auth";
import { verifyBearerIdToken } from "@/lib/server/firebase-admin";
import { resolveDiscoverableProfileByHandle } from "@/lib/server/people-handle";
import { createProfilePost, listProfilePosts } from "@/lib/server/profile-posts";
import { getDbOrNull } from "@/lib/server/works";

type Params = { params: Promise<{ handle: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { handle } = await params;
  const db = await getDbOrNull();
  if (!db) return jsonError("admin_not_configured", "서버 DB를 사용할 수 없습니다.", 503);

  const resolved = await resolveDiscoverableProfileByHandle(db, handle);
  if (!resolved) return jsonError("not_found", "프로필을 찾을 수 없습니다.", 404);

  const session = await verifyBearerIdToken(_request.headers.get("authorization"));
  const isSelf = session?.uid === resolved.uid;
  if (resolved.profile.isDiscoverable === false && !isSelf) {
    return jsonError("not_found", "프로필을 찾을 수 없습니다.", 404);
  }

  const posts = await listProfilePosts(db, resolved.uid);
  return NextResponse.json({ posts });
}

export async function POST(request: Request, { params }: Params) {
  const auth = await requireUser(request);
  if ("error" in auth) return auth.error;

  const { handle } = await params;
  const db = await getDbOrNull();
  if (!db) return jsonError("admin_not_configured", "서버 DB를 사용할 수 없습니다.", 503);

  const resolved = await resolveDiscoverableProfileByHandle(db, handle);
  if (!resolved) return jsonError("not_found", "프로필을 찾을 수 없습니다.", 404);
  if (resolved.uid !== auth.session.uid) {
    return jsonError("forbidden", "본인 프로필에만 글을 작성할 수 있습니다.", 403);
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
    const post = await createProfilePost(db, resolved.uid, text);
    return NextResponse.json({ post });
  } catch {
    return jsonError("create_failed", "글을 저장하지 못했습니다.", 500);
  }
}
