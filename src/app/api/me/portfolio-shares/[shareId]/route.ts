import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { jsonError, requireUser } from "@/lib/server/api-auth";
import { portfolioSharesCol } from "@/lib/server/portfolio";
import { getDbOrNull, worksCol } from "@/lib/server/works";

type Params = { params: Promise<{ shareId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireUser(request);
  if ("error" in auth) return auth.error;

  const { shareId } = await params;
  const db = await getDbOrNull();
  if (!db) return jsonError("admin_not_configured", "서버 DB를 사용할 수 없습니다.", 503);

  let body: {
    title?: string;
    includedWorkIds?: string[];
    excludedWorkIds?: string[];
    visibility?: "active" | "revoked";
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return jsonError("invalid_json", "요청 형식(JSON)이 올바르지 않습니다.", 400);
  }

  const ref = portfolioSharesCol(db, auth.session.uid).doc(shareId);
  const snap = await ref.get();
  if (!snap.exists) return jsonError("not_found", "링크를 찾을 수 없습니다.", 404);

  const updates: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };
  if (body.title !== undefined) updates.title = body.title.trim().slice(0, 200);
  if (body.includedWorkIds !== undefined) {
    updates.includedWorkIds = body.includedWorkIds.map(String);
  }
  if (body.excludedWorkIds !== undefined) {
    updates.excludedWorkIds = body.excludedWorkIds.map(String);
  }
  if (body.visibility === "active" || body.visibility === "revoked") {
    updates.visibility = body.visibility;
  }

  await ref.update(updates);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request, { params }: Params) {
  const auth = await requireUser(request);
  if ("error" in auth) return auth.error;

  const { shareId } = await params;
  const db = await getDbOrNull();
  if (!db) return jsonError("admin_not_configured", "서버 DB를 사용할 수 없습니다.", 503);

  await portfolioSharesCol(db, auth.session.uid).doc(shareId).update({
    visibility: "revoked",
    updatedAt: FieldValue.serverTimestamp(),
  });
  return NextResponse.json({ ok: true });
}
