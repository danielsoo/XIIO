import { NextResponse } from "next/server";
import { jsonError, requireUser } from "@/lib/server/api-auth";
import { getUidByHandle } from "@/lib/server/handles";
import { addRoomMembers } from "@/lib/server/rooms";
import { getDbOrNull } from "@/lib/server/works";

type Params = { params: Promise<{ roomId: string }> };

function errorMessage(code: string): string {
  switch (code) {
    case "forbidden":
      return "권한이 없습니다.";
    case "members_required":
      return "추가할 멤버를 지정해 주세요.";
    case "room_full":
      return "그룹 최대 인원을 초과했습니다.";
    default:
      return "멤버를 추가하지 못했습니다.";
  }
}

export async function POST(request: Request, { params }: Params) {
  const auth = await requireUser(request);
  if ("error" in auth) return auth.error;

  const { roomId } = await params;
  const db = await getDbOrNull();
  if (!db) return jsonError("admin_not_configured", "서버 DB를 사용할 수 없습니다.", 503);

  let body: { memberUids?: string[]; memberHandles?: string[] };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return jsonError("invalid_json", "요청 형식(JSON)이 올바르지 않습니다.", 400);
  }

  const uidsFromHandles = (
    await Promise.all((body.memberHandles ?? []).map((h) => getUidByHandle(db, h)))
  ).filter((uid): uid is string => Boolean(uid));

  const newUids = [...(body.memberUids ?? []), ...uidsFromHandles];

  const result = await addRoomMembers(db, roomId, auth.session.uid, newUids);
  if (!result.ok) {
    const status = result.code === "forbidden" ? 403 : result.code === "room_not_found" ? 404 : 400;
    return jsonError(result.code, errorMessage(result.code), status);
  }
  return NextResponse.json({ ok: true });
}
