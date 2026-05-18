import { NextResponse } from "next/server";
import { jsonError, requireUser } from "@/lib/server/api-auth";
import { FieldValue, getDbOrNull, parsePromoDoc, promoRef } from "@/lib/server/works";

type Params = { params: Promise<{ workId: string }> };

export async function POST(request: Request, { params }: Params) {
  const auth = await requireUser(request);
  if ("error" in auth) return auth.error;
  const { session } = auth;
  const { workId } = await params;

  let body: { reason?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    body = {};
  }

  const reason = (body.reason ?? "").trim().slice(0, 500);
  if (!reason) {
    return jsonError("reason_required", "삭제 사유를 입력해 주세요.", 400);
  }

  const db = await getDbOrNull();
  if (!db) return jsonError("admin_not_configured", "서버 DB를 사용할 수 없습니다.", 503);

  const ref = promoRef(db, session.uid, workId);
  const snap = await ref.get();
  if (!snap.exists) return jsonError("not_found", "홍보 쇼츠가 없습니다.", 404);

  const promo = parsePromoDoc(snap.data() as Record<string, unknown>);
  if (promo.platformStatus !== "published") {
    return jsonError("invalid_state", "게시된 쇼츠만 삭제 요청할 수 있습니다.", 400);
  }

  await ref.update({
    platformStatus: "removal_requested",
    deletionRequest: {
      reason,
      requestedAt: FieldValue.serverTimestamp(),
    },
    updatedAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ ok: true });
}
