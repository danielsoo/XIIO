import { NextResponse } from "next/server";
import { jsonError, requireUser } from "@/lib/server/api-auth";
import { followUser, unfollowUser } from "@/lib/server/follows";
import { getDbOrNull } from "@/lib/server/works";

type Params = { params: Promise<{ uid: string }> };

export async function POST(request: Request, { params }: Params) {
  const auth = await requireUser(request);
  if ("error" in auth) return auth.error;

  const { uid: targetUid } = await params;
  const db = await getDbOrNull();
  if (!db) return jsonError("admin_not_configured", "서버 DB를 사용할 수 없습니다.", 503);

  const result = await followUser(db, auth.session.uid, targetUid);
  if (!result.ok) {
    const msg =
      result.code === "self_follow"
        ? "자기 자신은 팔로우할 수 없습니다."
        : "사용자를 찾을 수 없습니다.";
    return jsonError(result.code, msg, 400);
  }
  return NextResponse.json({ ok: true, following: true });
}

export async function DELETE(request: Request, { params }: Params) {
  const auth = await requireUser(request);
  if ("error" in auth) return auth.error;

  const { uid: targetUid } = await params;
  const db = await getDbOrNull();
  if (!db) return jsonError("admin_not_configured", "서버 DB를 사용할 수 없습니다.", 503);

  await unfollowUser(db, auth.session.uid, targetUid);
  return NextResponse.json({ ok: true, following: false });
}
