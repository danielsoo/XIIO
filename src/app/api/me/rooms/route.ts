import { NextResponse } from "next/server";
import { adminTimestampToMillis } from "@/lib/admin/format-timestamp";
import { jsonError, requireUser } from "@/lib/server/api-auth";
import { getUidByHandle } from "@/lib/server/handles";
import { createRoom, isRoomUnread, listRoomsForUser } from "@/lib/server/rooms";
import { getDbOrNull } from "@/lib/server/works";
import { parseUserProfileDoc } from "@/lib/userAccess";

function timestampToIso(value: unknown): string | null {
  const ms = adminTimestampToMillis(value);
  return ms != null ? new Date(ms).toISOString() : null;
}

function errorMessage(code: string): string {
  switch (code) {
    case "name_required":
      return "그룹 이름을 입력해 주세요.";
    case "members_required":
      return "다른 멤버를 한 명 이상 추가해 주세요.";
    default:
      return "그룹을 만들지 못했습니다.";
  }
}

export async function GET(request: Request) {
  const auth = await requireUser(request);
  if ("error" in auth) return auth.error;

  const db = await getDbOrNull();
  if (!db) return jsonError("admin_not_configured", "서버 DB를 사용할 수 없습니다.", 503);

  const rows = await listRoomsForUser(db, auth.session.uid);
  const rooms = await Promise.all(
    rows.map(async (row) => {
      const previewUids = row.room.memberIds.filter((uid) => uid !== auth.session.uid).slice(0, 4);
      const memberPreview = await Promise.all(
        previewUids.map(async (uid) => {
          const snap = await db.collection("users").doc(uid).get();
          const profile = snap.exists
            ? parseUserProfileDoc(snap.data() as Record<string, unknown>)
            : null;
          return {
            uid,
            displayName: profile?.displayName ?? "—",
            avatarUrl: profile?.avatarUrl ?? null,
          };
        })
      );
      return {
        roomId: row.roomId,
        name: row.room.name,
        memberIds: row.room.memberIds,
        memberPreview,
        lastMessagePreview: row.room.lastMessagePreview ?? "",
        lastMessageAt: timestampToIso(row.room.lastMessageAt),
        lastSenderUid: row.room.lastSenderUid ?? null,
        unread: isRoomUnread(row.room, auth.session.uid),
      };
    })
  );

  return NextResponse.json({ rooms });
}

export async function POST(request: Request) {
  const auth = await requireUser(request);
  if ("error" in auth) return auth.error;

  const db = await getDbOrNull();
  if (!db) return jsonError("admin_not_configured", "서버 DB를 사용할 수 없습니다.", 503);

  let body: { name?: string; memberUids?: string[]; memberHandles?: string[] };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return jsonError("invalid_json", "요청 형식(JSON)이 올바르지 않습니다.", 400);
  }

  const uidsFromHandles = (
    await Promise.all((body.memberHandles ?? []).map((h) => getUidByHandle(db, h)))
  ).filter((uid): uid is string => Boolean(uid));

  const memberUids = [...(body.memberUids ?? []), ...uidsFromHandles];

  const result = await createRoom(db, auth.session.uid, body.name ?? "", memberUids);
  if (!result.ok) {
    return jsonError(result.code, errorMessage(result.code), 400);
  }
  return NextResponse.json({ ok: true, roomId: result.roomId });
}
