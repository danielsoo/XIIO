import { NextResponse } from "next/server";
import { jsonError, requireUser } from "@/lib/server/api-auth";
import { removeRoomMember } from "@/lib/server/rooms";
import { getDbOrNull } from "@/lib/server/works";

type Params = { params: Promise<{ roomId: string; uid: string }> };

function errorMessage(code: string): string {
  switch (code) {
    case "forbidden":
      return "권한이 없습니다.";
    case "not_a_member":
      return "이미 그룹에 없는 멤버입니다.";
    default:
      return "멤버를 제거하지 못했습니다.";
  }
}

export async function DELETE(request: Request, { params }: Params) {
  const auth = await requireUser(request);
  if ("error" in auth) return auth.error;

  const { roomId, uid } = await params;
  const db = await getDbOrNull();
  if (!db) return jsonError("admin_not_configured", "서버 DB를 사용할 수 없습니다.", 503);

  const result = await removeRoomMember(db, roomId, auth.session.uid, uid);
  if (!result.ok) {
    const status = result.code === "forbidden" ? 403 : result.code === "room_not_found" ? 404 : 400;
    return jsonError(result.code, errorMessage(result.code), status);
  }
  return NextResponse.json({ ok: true });
}
