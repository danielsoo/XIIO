import { NextResponse } from "next/server";
import { jsonError, requireUser } from "@/lib/server/api-auth";
import { acceptCollabInvite } from "@/lib/server/collab-invites";
import { getDbOrNull } from "@/lib/server/works";

type Params = { params: Promise<{ token: string }> };

export async function POST(request: Request, { params }: Params) {
  const auth = await requireUser(request);
  if ("error" in auth) return auth.error;

  const email = auth.session.email;
  if (!email) {
    return jsonError(
      "invite_email_required",
      "이메일이 확인된 계정으로 로그인한 뒤 수락해 주세요.",
      403
    );
  }

  const { token } = await params;
  if (!token?.trim()) {
    return jsonError("invalid_token", "유효하지 않은 초대 링크입니다.", 400);
  }

  const db = await getDbOrNull();
  if (!db) return jsonError("admin_not_configured", "서버 DB를 사용할 수 없습니다.", 503);

  const result = await acceptCollabInvite(db, token.trim(), auth.session.uid, email);
  if (!result.ok) {
    const messages: Record<string, string> = {
      invite_not_found: "초대를 찾을 수 없습니다.",
      invite_not_pending: "이미 처리된 초대입니다.",
      invite_expired: "만료된 초대입니다.",
      invite_email_mismatch: "초대받은 이메일과 로그인 이메일이 일치해야 합니다.",
      invite_owner_cannot_accept: "작품 소유자는 이 초대를 수락할 수 없습니다.",
      invite_already_accepted: "다른 계정으로 이미 수락된 초대입니다.",
      invite_email_required: "이메일 계정이 필요합니다.",
      work_not_found: "작품을 찾을 수 없습니다.",
      user_not_found: "사용자를 찾을 수 없습니다.",
    };
    const status = result.error === "invite_not_found" ? 404 : 400;
    return jsonError(
      result.error,
      messages[result.error] ?? "초대를 수락하지 못했습니다.",
      status
    );
  }

  return NextResponse.json({
    ok: true,
    workId: result.workId,
    ownerUid: result.ownerUid,
    alreadyAccepted: result.alreadyAccepted,
  });
}
