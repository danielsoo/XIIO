import { NextResponse } from "next/server";
import { timestampToIso } from "@/lib/collab-invite-pure";
import { jsonError, requireUser } from "@/lib/server/api-auth";
import {
  markRoomRead,
  parseRoomDoc,
  parseRoomMessage,
  roomMessagesCol,
  roomsCol,
  sendRoomMessage,
} from "@/lib/server/rooms";
import { getDbOrNull } from "@/lib/server/works";
import { parseUserProfileDoc } from "@/lib/userAccess";

type Params = { params: Promise<{ roomId: string }> };

export async function GET(request: Request, { params }: Params) {
  const auth = await requireUser(request);
  if ("error" in auth) return auth.error;

  const { roomId } = await params;
  const db = await getDbOrNull();
  if (!db) return jsonError("admin_not_configured", "서버 DB를 사용할 수 없습니다.", 503);

  const roomSnap = await roomsCol(db).doc(roomId).get();
  if (!roomSnap.exists) return jsonError("not_found", "그룹을 찾을 수 없습니다.", 404);
  const room = parseRoomDoc(roomSnap.data() as Record<string, unknown>);
  if (!room?.memberIds.includes(auth.session.uid)) {
    return jsonError("forbidden", "권한이 없습니다.", 403);
  }

  const url = new URL(request.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 50), 100);

  const snap = await roomMessagesCol(db, roomId).orderBy("createdAt", "desc").limit(limit).get();
  const messages = snap.docs
    .map((d) => parseRoomMessage(d.id, d.data() as Record<string, unknown>))
    .reverse()
    .map((m) => ({ ...m, createdAt: timestampToIso(m.createdAt) }));

  await markRoomRead(db, roomId, auth.session.uid);

  const members = await Promise.all(
    room.memberIds.map(async (uid) => {
      const snap = await db.collection("users").doc(uid).get();
      const profile = snap.exists
        ? parseUserProfileDoc(snap.data() as Record<string, unknown>)
        : null;
      return {
        uid,
        handle: profile?.handle ?? null,
        displayName: profile?.displayName ?? "—",
        avatarUrl: profile?.avatarUrl ?? null,
      };
    })
  );

  return NextResponse.json({
    roomId,
    name: room.name,
    createdBy: room.createdBy,
    members,
    messages,
  });
}

export async function POST(request: Request, { params }: Params) {
  const auth = await requireUser(request);
  if ("error" in auth) return auth.error;

  const { roomId } = await params;
  const db = await getDbOrNull();
  if (!db) return jsonError("admin_not_configured", "서버 DB를 사용할 수 없습니다.", 503);

  let body: { text?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return jsonError("invalid_json", "요청 형식(JSON)이 올바르지 않습니다.", 400);
  }

  const result = await sendRoomMessage(db, roomId, auth.session.uid, body.text ?? "");
  if (!result.ok) {
    const msg =
      result.code === "empty"
        ? "메시지를 입력해 주세요."
        : result.code === "forbidden"
          ? "권한이 없습니다."
          : "메시지 전송에 실패했습니다.";
    const status = result.code === "forbidden" ? 403 : result.code === "room_not_found" ? 404 : 400;
    return jsonError(result.code, msg, status);
  }
  return NextResponse.json({ ok: true, messageId: result.messageId });
}
