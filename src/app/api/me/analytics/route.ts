import { NextResponse } from "next/server";
import { jsonError, requireUser } from "@/lib/server/api-auth";
import { getUploaderAnalytics } from "@/lib/server/engagement";
import { getDbOrNull } from "@/lib/server/works";

export async function GET(request: Request) {
  const auth = await requireUser(request);
  if ("error" in auth) return auth.error;

  const db = await getDbOrNull();
  if (!db) return jsonError("admin_not_configured", "서버 DB를 사용할 수 없습니다.", 503);

  const daysRaw = new URL(request.url).searchParams.get("days");
  const days = Math.min(90, Math.max(7, daysRaw ? parseInt(daysRaw, 10) || 30 : 30));

  const payload = await getUploaderAnalytics(db, auth.session.uid, days);
  return NextResponse.json(payload);
}
