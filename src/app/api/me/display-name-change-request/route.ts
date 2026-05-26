import { NextResponse } from "next/server";
import { jsonError, requireUser } from "@/lib/server/api-auth";
import { submitUserChangeRequest } from "@/lib/server/profile-change-request";
import { getDbOrNull } from "@/lib/server/works";
import { parseUserProfileDoc } from "@/lib/userAccess";

export async function POST(request: Request) {
  const auth = await requireUser(request);
  if ("error" in auth) return auth.error;

  const db = await getDbOrNull();
  if (!db) return jsonError("admin_not_configured", "서버 DB를 사용할 수 없습니다.", 503);

  let body: { requestedName?: string; reason?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return jsonError("invalid_json", "요청 형식(JSON)이 올바르지 않습니다.", 400);
  }

  const snap = await db.collection("users").doc(auth.session.uid).get();
  const profile = parseUserProfileDoc(snap.data() as Record<string, unknown>);

  const result = await submitUserChangeRequest({
    db,
    uid: auth.session.uid,
    field: "displayNameChangeRequest",
    requestedName: body.requestedName ?? "",
    reason: body.reason,
    currentValue: profile.displayName,
    requireCurrent: true,
    sameValueError: "현재 표시 이름과 동일합니다.",
  });

  if (!result.ok) {
    return jsonError(result.code, result.message, result.status);
  }

  return NextResponse.json({ ok: true, displayNameChangeRequest: result.request });
}
