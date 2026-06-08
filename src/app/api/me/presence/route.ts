import { NextResponse } from "next/server";
import { jsonError, requireUser } from "@/lib/server/api-auth";
import { touchUserPresence } from "@/lib/server/user-activity";

export async function POST(request: Request) {
  const auth = await requireUser(request);
  if ("error" in auth) return auth.error;

  try {
    await touchUserPresence(auth.session.uid);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[me/presence]", msg);
    return jsonError("presence_update_failed", "접속 상태를 갱신하지 못했습니다.", 500);
  }
}
