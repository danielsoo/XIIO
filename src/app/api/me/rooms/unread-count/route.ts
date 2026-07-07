import { NextResponse } from "next/server";
import { jsonError, requireUser } from "@/lib/server/api-auth";
import { countUnreadRoomsForUser } from "@/lib/server/rooms";
import { getDbOrNull } from "@/lib/server/works";

/** 사이드바·벨 배지용 — 프로필 조회 없이 카운트만 반환하는 가벼운 엔드포인트 */
export async function GET(request: Request) {
  const auth = await requireUser(request);
  if ("error" in auth) return auth.error;

  const db = await getDbOrNull();
  if (!db) return jsonError("admin_not_configured", "서버 DB를 사용할 수 없습니다.", 503);

  const count = await countUnreadRoomsForUser(db, auth.session.uid);
  return NextResponse.json({ count });
}
