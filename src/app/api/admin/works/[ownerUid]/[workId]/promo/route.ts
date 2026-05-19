import { NextResponse } from "next/server";
import { deleteStreamVideo } from "@/lib/cloudflare/stream";
import { jsonError, requireAdmin } from "@/lib/server/api-auth";
import {
  approvePromoRevision,
  rejectPromoRevision,
} from "@/lib/server/content-revisions";
import {
  FieldValue,
  getDbOrNull,
  parsePromoDoc,
  parseWorkDoc,
  promoRef,
  worksCol,
} from "@/lib/server/works";
import { parseRevisionReviewStatus } from "@/lib/server/revision-parse";

type Params = { params: Promise<{ ownerUid: string; workId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;
  const { session } = auth;
  const { ownerUid, workId } = await params;

  let body: { action?: string; rejectReason?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return jsonError("invalid_json", "요청 형식이 올바르지 않습니다.", 400);
  }

  const action = body.action;
  if (!action) return jsonError("action_required", "action이 필요합니다.", 400);

  const db = await getDbOrNull();
  if (!db) return jsonError("admin_not_configured", "서버 DB를 사용할 수 없습니다.", 503);

  const workSnap = await worksCol(db, ownerUid).doc(workId).get();
  if (!workSnap.exists) return jsonError("not_found", "작품을 찾을 수 없습니다.", 404);

  const ref = promoRef(db, ownerUid, workId);
  const snap = await ref.get();
  if (!snap.exists) return jsonError("not_found", "홍보 쇼츠가 없습니다.", 404);

  const raw = snap.data() as Record<string, unknown>;
  const promo = parsePromoDoc(raw);
  const work = parseWorkDoc(workId, workSnap.data() as Record<string, unknown>);
  const isRevision =
    promo.platformStatus === "published" &&
    parseRevisionReviewStatus(raw) === "pending" &&
    promo.pendingRevision?.platformStatus === "pending";

  if (action === "approve") {
    if (isRevision) {
      try {
        await approvePromoRevision(db, ownerUid, workId, session.uid);
        return NextResponse.json({ ok: true, platformStatus: "published", revisionApplied: true });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (msg === "not_ready") {
          return jsonError("not_ready", "클립 인코딩이 완료된 후 승인할 수 있습니다.", 400);
        }
        if (msg === "invalid_state") {
          return jsonError("invalid_state", "수정 심사 상태가 아닙니다.", 400);
        }
        throw e;
      }
    }
    if (promo.streamStatus !== "ready") {
      return jsonError("not_ready", "클립 인코딩이 완료된 후 승인할 수 있습니다.", 400);
    }
    await ref.update({
      platformStatus: "published",
      publishedAt: FieldValue.serverTimestamp(),
      reviewedAt: FieldValue.serverTimestamp(),
      reviewedBy: session.uid,
      rejectReason: FieldValue.delete(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return NextResponse.json({ ok: true, platformStatus: "published" });
  }

  if (action === "reject") {
    const reason = (body.rejectReason ?? "").trim().slice(0, 500) || "반려됨";
    if (isRevision) {
      try {
        await rejectPromoRevision(db, ownerUid, workId, session.uid, reason);
        return NextResponse.json({ ok: true, revisionReviewStatus: "rejected" });
      } catch {
        return jsonError("invalid_state", "수정 심사 상태가 아닙니다.", 400);
      }
    }
    await ref.update({
      platformStatus: "rejected",
      rejectReason: reason,
      reviewedAt: FieldValue.serverTimestamp(),
      reviewedBy: session.uid,
      updatedAt: FieldValue.serverTimestamp(),
    });
    return NextResponse.json({ ok: true, platformStatus: "rejected" });
  }

  if (action === "approve_removal") {
    if (promo.platformStatus !== "removal_requested") {
      return jsonError("invalid_state", "삭제 요청 상태가 아닙니다.", 400);
    }
    if (promo.streamUid) {
      try {
        await deleteStreamVideo(promo.streamUid);
      } catch {
        /* ignore */
      }
    }
    await ref.delete();
    return NextResponse.json({ ok: true, deleted: true });
  }

  if (action === "reject_removal") {
    if (promo.platformStatus !== "removal_requested") {
      return jsonError("invalid_state", "삭제 요청 상태가 아닙니다.", 400);
    }
    await ref.update({
      platformStatus: "published",
      deletionRequest: FieldValue.delete(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return NextResponse.json({ ok: true, platformStatus: "published" });
  }

  return jsonError("invalid_action", "알 수 없는 action 입니다.", 400);
}
