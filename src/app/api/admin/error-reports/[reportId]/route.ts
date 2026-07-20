import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { jsonError, requireAdmin } from "@/lib/server/api-auth";
import { getDbOrNull } from "@/lib/server/works";

type Params = { params: Promise<{ reportId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;
  const { session } = auth;
  const { reportId } = await params;

  let body: { adminNote?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return jsonError("invalid_json", "요청 형식이 올바르지 않습니다.", 400);
  }

  const db = await getDbOrNull();
  if (!db) return jsonError("admin_not_configured", "서버 DB를 사용할 수 없습니다.", 503);

  const ref = db.collection("errorReports").doc(reportId);
  const snap = await ref.get();
  if (!snap.exists) return jsonError("not_found", "오류 신고를 찾을 수 없습니다.", 404);
  if (snap.get("status") !== "pending") {
    return jsonError("already_resolved", "이미 처리된 오류 신고입니다.", 400);
  }

  await ref.update({
    status: "resolved",
    resolvedAt: FieldValue.serverTimestamp(),
    resolvedByUid: session.uid,
    adminNote: body.adminNote?.trim().slice(0, 2_000) || null,
  });

  return NextResponse.json({ ok: true, status: "resolved" });
}
