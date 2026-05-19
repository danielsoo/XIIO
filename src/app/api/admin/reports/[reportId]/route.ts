import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { jsonError, requireAdmin } from "@/lib/server/api-auth";
import { parseReportDoc } from "@/lib/server/reports";
import {
  getDbOrNull,
  parsePromoDoc,
  parseWorkDoc,
  promoRef,
  worksCol,
} from "@/lib/server/works";

type Params = { params: Promise<{ reportId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;
  const { session } = auth;
  const { reportId } = await params;

  let body: { action?: string; adminNote?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return jsonError("invalid_json", "요청 형식이 올바르지 않습니다.", 400);
  }

  const action = body.action?.trim();
  if (action !== "dismiss" && action !== "uphold") {
    return jsonError("invalid_action", "action이 올바르지 않습니다.", 400);
  }

  const adminNote = body.adminNote?.trim() ?? "";

  const db = await getDbOrNull();
  if (!db) return jsonError("admin_not_configured", "서버 DB를 사용할 수 없습니다.", 503);

  const reportRef = db.collection("reports").doc(reportId);
  const reportSnap = await reportRef.get();
  if (!reportSnap.exists) {
    return jsonError("not_found", "신고를 찾을 수 없습니다.", 404);
  }

  const report = parseReportDoc(reportSnap.data() as Record<string, unknown>);
  if (report.status !== "pending") {
    return jsonError("already_resolved", "이미 처리된 신고입니다.", 400);
  }

  const resolvedFields = {
    resolvedAt: FieldValue.serverTimestamp(),
    resolvedByUid: session.uid,
    adminNote: adminNote || null,
  };

  if (action === "dismiss") {
    await reportRef.update({
      status: "dismissed",
      ...resolvedFields,
    });
    return NextResponse.json({ ok: true, status: "dismissed" });
  }

  const { targetType, targetOwnerUid, targetWorkId } = report;

  if (targetType === "full") {
    const workRef = worksCol(db, targetOwnerUid).doc(targetWorkId);
    const workSnap = await workRef.get();
    if (!workSnap.exists) {
      return jsonError("target_not_found", "작품을 찾을 수 없습니다.", 404);
    }
    const work = parseWorkDoc(targetWorkId, workSnap.data() as Record<string, unknown>);
    if (work.platformStatus !== "published") {
      return jsonError("target_not_published", "게시 중인 작품만 조치할 수 있습니다.", 400);
    }
    await workRef.update({
      platformStatus: "pending",
      ...(adminNote ? { rejectReason: adminNote } : {}),
      updatedAt: FieldValue.serverTimestamp(),
    });
  } else {
    const pRef = promoRef(db, targetOwnerUid, targetWorkId);
    const promoSnap = await pRef.get();
    if (!promoSnap.exists) {
      return jsonError("target_not_found", "쇼츠를 찾을 수 없습니다.", 404);
    }
    const promo = parsePromoDoc(promoSnap.data() as Record<string, unknown>);
    if (promo.platformStatus !== "published") {
      return jsonError("target_not_published", "게시 중인 쇼츠만 조치할 수 있습니다.", 400);
    }
    await pRef.update({
      platformStatus: "pending",
      ...(adminNote ? { rejectReason: adminNote } : {}),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  await reportRef.update({
    status: "action_taken",
    ...resolvedFields,
  });

  return NextResponse.json({ ok: true, status: "action_taken" });
}
