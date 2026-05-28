import { NextResponse } from "next/server";
import { jsonError, requireUser } from "@/lib/server/api-auth";
import {
  listPendingCollabInvitesForEmail,
  normalizeInviteEmail,
} from "@/lib/server/collab-invites";
import { getDbOrNull } from "@/lib/server/works";

export async function GET(request: Request) {
  const auth = await requireUser(request);
  if ("error" in auth) return auth.error;

  const email = auth.session.email;
  if (!email) {
    return jsonError("invite_email_required", "이메일이 확인된 계정만 초대를 볼 수 있습니다.", 403);
  }

  const normalized = normalizeInviteEmail(email);
  if (!normalized) {
    return jsonError("invite_email_required", "유효한 이메일 계정이 필요합니다.", 403);
  }

  const db = await getDbOrNull();
  if (!db) return jsonError("admin_not_configured", "서버 DB를 사용할 수 없습니다.", 503);

  const invites = await listPendingCollabInvitesForEmail(db, normalized);
  return NextResponse.json({ invites });
}
