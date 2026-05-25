import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { jsonError, requireUser } from "@/lib/server/api-auth";
import { getDbOrNull, worksCol } from "@/lib/server/works";

type Params = { params: Promise<{ workId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireUser(request);
  if ("error" in auth) return auth.error;

  const { workId } = await params;
  const db = await getDbOrNull();
  if (!db) return jsonError("admin_not_configured", "서버 DB를 사용할 수 없습니다.", 503);

  let body: { portfolioSubmissionHidden?: boolean };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return jsonError("invalid_json", "요청 형식(JSON)이 올바르지 않습니다.", 400);
  }

  const ref = worksCol(db, auth.session.uid).doc(workId);
  const snap = await ref.get();
  if (!snap.exists) return jsonError("not_found", "작품을 찾을 수 없습니다.", 404);

  await ref.update({
    portfolioSubmissionHidden: body.portfolioSubmissionHidden === true,
    updatedAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ ok: true, portfolioSubmissionHidden: body.portfolioSubmissionHidden === true });
}
