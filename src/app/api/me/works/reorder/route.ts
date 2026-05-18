import { NextResponse } from "next/server";
import { jsonError, requireUser } from "@/lib/server/api-auth";
import { FieldValue, getDbOrNull, worksCol } from "@/lib/server/works";

export async function PATCH(request: Request) {
  const auth = await requireUser(request);
  if ("error" in auth) return auth.error;
  const { session } = auth;

  let body: { workIds?: string[] };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return jsonError("invalid_json", "요청 형식이 올바르지 않습니다.", 400);
  }

  const workIds = body.workIds;
  if (!Array.isArray(workIds) || workIds.length === 0) {
    return jsonError("invalid_body", "workIds 배열이 필요합니다.", 400);
  }

  const db = await getDbOrNull();
  if (!db) {
    return jsonError("admin_not_configured", "서버 DB를 사용할 수 없습니다.", 503);
  }

  const batch = db.batch();
  workIds.forEach((id, index) => {
    batch.update(worksCol(db, session.uid).doc(id), {
      sortOrder: index,
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
  await batch.commit();

  return NextResponse.json({ ok: true });
}
