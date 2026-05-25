import { NextResponse } from "next/server";
import { jsonError, requireUser } from "@/lib/server/api-auth";
import { getOrCreateThread, listThreadsForUser } from "@/lib/server/dm";
import { getUidByHandle } from "@/lib/server/handles";
import { getDbOrNull } from "@/lib/server/works";
import { parseUserProfileDoc } from "@/lib/userAccess";

export async function GET(request: Request) {
  const auth = await requireUser(request);
  if ("error" in auth) return auth.error;

  const db = await getDbOrNull();
  if (!db) return jsonError("admin_not_configured", "서버 DB를 사용할 수 없습니다.", 503);

  const rows = await listThreadsForUser(db, auth.session.uid);
  const threads = await Promise.all(
    rows.map(async (row) => {
      if (!row) return null;
      const snap = await db.collection("users").doc(row.otherUid).get();
      const profile = snap.exists
        ? parseUserProfileDoc(snap.data() as Record<string, unknown>)
        : null;
      return {
        threadId: row.threadId,
        otherUid: row.otherUid,
        otherHandle: profile?.handle ?? null,
        otherDisplayName: profile?.displayName ?? "—",
        lastMessagePreview: row.thread.lastMessagePreview ?? "",
        lastMessageAt: row.thread.lastMessageAt ?? null,
      };
    })
  );

  return NextResponse.json({ threads: threads.filter(Boolean) });
}

export async function POST(request: Request) {
  const auth = await requireUser(request);
  if ("error" in auth) return auth.error;

  const db = await getDbOrNull();
  if (!db) return jsonError("admin_not_configured", "서버 DB를 사용할 수 없습니다.", 503);

  let body: { targetUid?: string; handle?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return jsonError("invalid_json", "요청 형식(JSON)이 올바르지 않습니다.", 400);
  }

  let targetUid = body.targetUid?.trim();
  if (!targetUid && body.handle?.trim()) {
    targetUid = (await getUidByHandle(db, body.handle)) ?? undefined;
  }
  if (!targetUid) return jsonError("target_required", "대화 상대를 지정해 주세요.", 400);

  const created = await getOrCreateThread(db, auth.session.uid, targetUid);
  if ("error" in created) {
    const msg =
      created.error === "blocked"
        ? "차단되어 메시지를 보낼 수 없습니다."
        : "대화를 시작할 수 없습니다.";
    return jsonError(created.error, msg, 400);
  }

  return NextResponse.json({ threadId: created.threadId });
}
