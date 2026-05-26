import { NextResponse } from "next/server";
import {
  DeleteAccountError,
  deleteUserAccount,
  isValidDeleteConfirmPhrase,
} from "@/lib/server/delete-account";
import { getDbOrNull } from "@/lib/server/works";
import { jsonError, requireUser } from "@/lib/server/api-auth";

export async function POST(request: Request) {
  const auth = await requireUser(request);
  if ("error" in auth) return auth.error;

  let body: { confirmPhrase?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    body = {};
  }

  const confirmPhrase = String(body.confirmPhrase ?? "").trim();
  if (!isValidDeleteConfirmPhrase(confirmPhrase)) {
    return jsonError("invalid_confirm", "확인 문구가 올바르지 않습니다.", 400);
  }

  const db = await getDbOrNull();
  if (!db) {
    return jsonError("admin_not_configured", "서버 DB를 사용할 수 없습니다.", 503);
  }

  try {
    const result = await deleteUserAccount(db, auth.session.uid);
    if (!result.ok) {
      if (result.authDeleteFailed) {
        return jsonError(
          "auth_delete_failed",
          "계정 데이터는 삭제되었으나 로그인 정보 삭제에 실패했습니다. 고객 지원에 문의해 주세요.",
          500
        );
      }
      return jsonError("delete_failed", "탈퇴 처리에 실패했습니다.", 500);
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof DeleteAccountError) {
      return jsonError(e.code, e.message, e.status);
    }
    console.error("[account/delete]", e);
    return jsonError("delete_failed", "탈퇴 처리에 실패했습니다.", 500);
  }
}
