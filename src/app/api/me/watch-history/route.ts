import { NextResponse } from "next/server";
import { listWatchHistory } from "@/lib/server/account-activity";
import { jsonError, requireUser } from "@/lib/server/api-auth";
import { getDbOrNull } from "@/lib/server/works";

export async function GET(request: Request) {
  const auth = await requireUser(request);
  if ("error" in auth) return auth.error;

  const db = await getDbOrNull();
  if (!db) return jsonError("admin_not_configured", "서버 DB를 사용할 수 없습니다.", 503);

  const items = await listWatchHistory(db, auth.session.uid);
  return NextResponse.json({ items });
}
