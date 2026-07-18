import { NextResponse } from "next/server";
import { jsonError, requireUser } from "@/lib/server/api-auth";
import { listFollowingUids } from "@/lib/server/follows";
import { getDbOrNull } from "@/lib/server/works";

export async function GET(request: Request) {
  const auth = await requireUser(request);
  if ("error" in auth) return auth.error;

  const db = await getDbOrNull();
  if (!db) return jsonError("admin_not_configured", "서버 DB를 사용할 수 없습니다.", 503);

  const uids = await listFollowingUids(db, auth.session.uid);
  return NextResponse.json(
    { uids },
    { headers: { "Cache-Control": "private, max-age=30, stale-while-revalidate=120" } }
  );
}
