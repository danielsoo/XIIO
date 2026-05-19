import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { jsonError, requireUser } from "@/lib/server/api-auth";
import { isReportReasonCode, isReportTargetType } from "@/lib/server/reports";
import {
  getDbOrNull,
  parsePromoDoc,
  parseWorkDoc,
  promoRef,
  worksCol,
} from "@/lib/server/works";

export async function POST(request: Request) {
  const auth = await requireUser(request);
  if ("error" in auth) return auth.error;
  const { session } = auth;

  let body: {
    targetType?: string;
    targetOwnerUid?: string;
    targetWorkId?: string;
    reasonCode?: string;
    reasonDetail?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return jsonError("invalid_json", "요청 형식이 올바르지 않습니다.", 400);
  }

  const targetType = body.targetType?.trim() ?? "";
  const targetOwnerUid = body.targetOwnerUid?.trim() ?? "";
  const targetWorkId = body.targetWorkId?.trim() ?? "";
  const reasonCode = body.reasonCode?.trim() ?? "";
  const reasonDetail = body.reasonDetail?.trim() ?? "";

  if (!isReportTargetType(targetType)) {
    return jsonError("invalid_target_type", "신고 대상 유형이 올바르지 않습니다.", 400);
  }
  if (!targetOwnerUid || !targetWorkId) {
    return jsonError("invalid_target", "신고 대상 정보가 필요합니다.", 400);
  }
  if (!isReportReasonCode(reasonCode)) {
    return jsonError("invalid_reason", "신고 사유를 선택해 주세요.", 400);
  }
  if (reasonCode === "other" && !reasonDetail) {
    return jsonError("detail_required", "기타 사유는 상세 설명이 필요합니다.", 400);
  }

  const db = await getDbOrNull();
  if (!db) return jsonError("admin_not_configured", "서버 DB를 사용할 수 없습니다.", 503);

  if (targetType === "full") {
    const workSnap = await worksCol(db, targetOwnerUid).doc(targetWorkId).get();
    if (!workSnap.exists) {
      return jsonError("not_found", "작품을 찾을 수 없습니다.", 404);
    }
    const work = parseWorkDoc(targetWorkId, workSnap.data() as Record<string, unknown>);
    if (work.platformStatus !== "published") {
      return jsonError("not_reportable", "신고할 수 없는 상태입니다.", 400);
    }
  } else {
    const promoSnap = await promoRef(db, targetOwnerUid, targetWorkId).get();
    if (!promoSnap.exists) {
      return jsonError("not_found", "쇼츠를 찾을 수 없습니다.", 404);
    }
    const promo = parsePromoDoc(promoSnap.data() as Record<string, unknown>);
    if (promo.platformStatus !== "published") {
      return jsonError("not_reportable", "신고할 수 없는 상태입니다.", 400);
    }
  }

  const dupSnap = await db
    .collection("reports")
    .where("reporterUid", "==", session.uid)
    .where("targetOwnerUid", "==", targetOwnerUid)
    .where("targetWorkId", "==", targetWorkId)
    .where("status", "==", "pending")
    .limit(1)
    .get();

  if (!dupSnap.empty) {
    return jsonError("duplicate_report", "이미 접수된 신고가 있습니다.", 409);
  }

  await db.collection("reports").add({
    targetType,
    targetOwnerUid,
    targetWorkId,
    reporterUid: session.uid,
    reporterEmail: session.email ?? null,
    reasonCode,
    reasonDetail: reasonDetail || null,
    status: "pending",
    createdAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ ok: true });
}
