import { NextResponse } from "next/server";
import { jsonError, requireUser } from "@/lib/server/api-auth";
import { leaveRoom } from "@/lib/server/rooms";
import { getDbOrNull } from "@/lib/server/works";

type Params = { params: Promise<{ roomId: string }> };

export async function POST(request: Request, { params }: Params) {
  const auth = await requireUser(request);
  if ("error" in auth) return auth.error;

  const { roomId } = await params;
  const db = await getDbOrNull();
  if (!db) return jsonError("admin_not_configured", "서버 DB를 사용할 수 없습니다.", 503);

  const result = await leaveRoom(db, roomId, auth.session.uid);
  if (!result.ok) {
    const status = result.code === "room_not_found" ? 404 : 400;
    return jsonError(result.code, "그룹에서 나가지 못했습니다.", status);
  }
  return NextResponse.json({ ok: true });
}
