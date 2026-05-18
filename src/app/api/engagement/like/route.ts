import { NextResponse } from "next/server";
import { jsonError, requireUser } from "@/lib/server/api-auth";
import { isPromoLiked, setPromoLike } from "@/lib/server/engagement";
import { getDbOrNull } from "@/lib/server/works";
import type { LikeBody } from "@/types/engagement";

export async function POST(request: Request) {
  const auth = await requireUser(request);
  if ("error" in auth) return auth.error;

  const db = await getDbOrNull();
  if (!db) return jsonError("admin_not_configured", "서버 DB를 사용할 수 없습니다.", 503);

  let body: LikeBody;
  try {
    body = (await request.json()) as LikeBody;
  } catch {
    return jsonError("invalid_body", "요청 형식이 올바르지 않습니다.", 400);
  }

  const { ownerUid, workId, liked } = body;
  if (!ownerUid || !workId || typeof liked !== "boolean") {
    return jsonError("invalid_body", "ownerUid, workId, liked가 필요합니다.", 400);
  }

  const result = await setPromoLike(db, auth.session.uid, ownerUid, workId, liked);
  if (!result.ok) {
    if (result.error === "not_found") {
      return jsonError("not_found", "작품을 찾을 수 없습니다.", 404);
    }
    return jsonError("not_published", "공개된 쇼츠가 아닙니다.", 404);
  }

  return NextResponse.json({ ok: true, likeCount: result.likeCount, liked });
}

export async function GET(request: Request) {
  const auth = await requireUser(request);
  if ("error" in auth) return auth.error;

  const db = await getDbOrNull();
  if (!db) return jsonError("admin_not_configured", "서버 DB를 사용할 수 없습니다.", 503);

  const { searchParams } = new URL(request.url);
  const ownerUid = searchParams.get("ownerUid");
  const workId = searchParams.get("workId");
  if (!ownerUid || !workId) {
    return jsonError("invalid_query", "ownerUid, workId가 필요합니다.", 400);
  }

  const liked = await isPromoLiked(db, auth.session.uid, ownerUid, workId);
  return NextResponse.json({ liked });
}
