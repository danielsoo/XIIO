import { NextResponse } from "next/server";
import { jsonError, requireUser } from "@/lib/server/api-auth";
import { markAllNotificationsRead } from "@/lib/server/notifications";
import { getDbOrNull } from "@/lib/server/works";

export async function POST(request: Request) {
  const auth = await requireUser(request);
  if ("error" in auth) return auth.error;

  const db = await getDbOrNull();
  if (!db) return jsonError("admin_not_configured", "서버 DB를 사용할 수 없습니다.", 503);

  await markAllNotificationsRead(db, auth.session.uid);
  return NextResponse.json({ ok: true });
}
