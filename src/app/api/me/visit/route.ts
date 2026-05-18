import { NextResponse } from "next/server";
import { jsonError, requireUser } from "@/lib/server/api-auth";
import { recordUserVisit } from "@/lib/server/user-activity";

export async function POST(request: Request) {
  const auth = await requireUser(request);
  if ("error" in auth) return auth.error;

  try {
    const { visitCount } = await recordUserVisit(auth.session.uid);
    return NextResponse.json({ ok: true, visitCount });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[me/visit]", msg);
    return jsonError("visit_record_failed", "방문 기록에 실패했습니다.", 500);
  }
}
