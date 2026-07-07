import { NextResponse } from "next/server";
import { jsonError, requireUser } from "@/lib/server/api-auth";
import {
  dmMessagesCol,
  dmThreadsCol,
  markThreadRead,
  parseDmMessage,
  parseDmThread,
  sendDmMessage,
} from "@/lib/server/dm";
import { getDbOrNull } from "@/lib/server/works";
import { parseUserProfileDoc } from "@/lib/userAccess";

type Params = { params: Promise<{ threadId: string }> };

export async function GET(request: Request, { params }: Params) {
  const auth = await requireUser(request);
  if ("error" in auth) return auth.error;

  const { threadId } = await params;
  const db = await getDbOrNull();
  if (!db) return jsonError("admin_not_configured", "서버 DB를 사용할 수 없습니다.", 503);

  const threadSnap = await dmThreadsCol(db).doc(threadId).get();
  if (!threadSnap.exists) return jsonError("not_found", "대화를 찾을 수 없습니다.", 404);
  const thread = parseDmThread(threadSnap.data() as Record<string, unknown>);
  if (!thread?.participantIds.includes(auth.session.uid)) {
    return jsonError("forbidden", "권한이 없습니다.", 403);
  }

  const url = new URL(request.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 50), 100);

  const snap = await dmMessagesCol(db, threadId)
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();

  const messages = snap.docs
    .map((d) => parseDmMessage(d.id, d.data() as Record<string, unknown>))
    .reverse();

  await markThreadRead(db, threadId, auth.session.uid);

  const otherUid = thread.participantIds.find((id) => id !== auth.session.uid) ?? "";
  const otherSnap = await db.collection("users").doc(otherUid).get();
  const otherProfile = otherSnap.exists
    ? parseUserProfileDoc(otherSnap.data() as Record<string, unknown>)
    : null;

  return NextResponse.json({
    threadId,
    otherUid,
    otherHandle: otherProfile?.handle ?? null,
    otherDisplayName: otherProfile?.displayName ?? "—",
    otherAvatarUrl: otherProfile?.avatarUrl ?? null,
    messages,
  });
}

export async function POST(request: Request, { params }: Params) {
  const auth = await requireUser(request);
  if ("error" in auth) return auth.error;

  const { threadId } = await params;
  const db = await getDbOrNull();
  if (!db) return jsonError("admin_not_configured", "서버 DB를 사용할 수 없습니다.", 503);

  let body: { text?: string; otherUidHint?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return jsonError("invalid_json", "요청 형식(JSON)이 올바르지 않습니다.", 400);
  }

  const result = await sendDmMessage(db, threadId, auth.session.uid, body.text ?? "", body.otherUidHint);
  if (!result.ok) {
    const msg =
      result.code === "blocked"
        ? "차단되어 메시지를 보낼 수 없습니다."
        : result.code === "empty"
          ? "메시지를 입력해 주세요."
          : "메시지 전송에 실패했습니다.";
    return jsonError(result.code, msg, 400);
  }
  return NextResponse.json({ ok: true, messageId: result.messageId });
}
