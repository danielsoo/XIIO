import { NextResponse } from "next/server";
import { deleteStreamVideo } from "@/lib/cloudflare/stream";
import { recordAdminAudit } from "@/lib/server/admin-audit";
import { jsonError, requireAdmin } from "@/lib/server/api-auth";
import {
  FieldValue,
  getDbOrNull,
  parsePrologueDoc,
  parseWorkDoc,
  prologueRef,
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

  const ref = prologueRef(db, ownerUid, workId);
  const snap = await ref.get();
  if (!snap.exists) return jsonError("not_found", "프롤로그가 없습니다.", 404);

  const raw = snap.data() as Record<string, unknown>;
  const prologue = parsePrologueDoc(raw);
  const work = parseWorkDoc(workId, workSnap.data() as Record<string, unknown>);
  const isRevision =
    prologue.platformStatus === "published" &&
    parseRevisionReviewStatus(raw) === "pending" &&
    prologue.pendingRevision?.platformStatus === "pending";

  if (action === "approve") {
    if (isRevision) {
      const rev = prologue.pendingRevision;
      if (!rev?.streamUid || rev.streamStatus !== "ready") {
        return jsonError("not_ready", "인코딩이 완료된 후 승인할 수 있습니다.", 400);
      }
      await ref.update({
        streamUid: rev.streamUid,
        streamStatus: "ready",
        durationSec: rev.durationSec,
        title: rev.title ?? prologue.title,
        description: rev.description ?? prologue.description,
        pendingRevision: FieldValue.delete(),
        revisionReviewStatus: FieldValue.delete(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      if (prologue.streamUid && prologue.streamUid !== rev.streamUid) {
        try {
          await deleteStreamVideo(prologue.streamUid);
        } catch {
          /* ignore */
        }
      }
      await recordAdminAudit(db, {
        actorUid: session.uid,
        action: "prologue_revision_approve",
        targetOwnerUid: ownerUid,
        targetWorkId: workId,
        targetType: "prologue",
        workTitle: work.title,
      });
      return NextResponse.json({ ok: true, platformStatus: "published", revisionApplied: true });
    }
    if (prologue.streamStatus !== "ready") {
      return jsonError("not_ready", "인코딩이 완료된 후 승인할 수 있습니다.", 400);
    }
    await ref.update({
      platformStatus: "published",
      publishedAt: FieldValue.serverTimestamp(),
      reviewedAt: FieldValue.serverTimestamp(),
      reviewedBy: session.uid,
      rejectReason: FieldValue.delete(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    await recordAdminAudit(db, {
      actorUid: session.uid,
      action: "prologue_approve",
      targetOwnerUid: ownerUid,
      targetWorkId: workId,
      targetType: "prologue",
      workTitle: work.title,
    });
    return NextResponse.json({ ok: true, platformStatus: "published" });
  }

  if (action === "reject") {
    const reason = (body.rejectReason ?? "").trim().slice(0, 500) || "반려됨";
    if (isRevision) {
      await ref.update({
        "pendingRevision.platformStatus": "rejected",
        "pendingRevision.rejectReason": reason,
        revisionReviewStatus: "rejected",
        updatedAt: FieldValue.serverTimestamp(),
      });
      await recordAdminAudit(db, {
        actorUid: session.uid,
        action: "prologue_revision_reject",
        targetOwnerUid: ownerUid,
        targetWorkId: workId,
        targetType: "prologue",
        workTitle: work.title,
        note: reason,
      });
      return NextResponse.json({ ok: true, revisionReviewStatus: "rejected" });
    }
    await ref.update({
      platformStatus: "rejected",
      rejectReason: reason,
      reviewedAt: FieldValue.serverTimestamp(),
      reviewedBy: session.uid,
      updatedAt: FieldValue.serverTimestamp(),
    });
    await recordAdminAudit(db, {
      actorUid: session.uid,
      action: "prologue_reject",
      targetOwnerUid: ownerUid,
      targetWorkId: workId,
      targetType: "prologue",
      workTitle: work.title,
      note: reason,
    });
    return NextResponse.json({ ok: true, platformStatus: "rejected" });
  }

  if (action === "approve_removal") {
    if (prologue.platformStatus !== "removal_requested") {
      return jsonError("invalid_state", "삭제 요청 상태가 아닙니다.", 400);
    }
    if (prologue.streamUid) {
      try {
        await deleteStreamVideo(prologue.streamUid);
      } catch {
        /* ignore */
      }
    }
    await recordAdminAudit(db, {
      actorUid: session.uid,
      action: "prologue_removal_approve",
      targetOwnerUid: ownerUid,
      targetWorkId: workId,
      targetType: "prologue",
      workTitle: work.title,
    });
    await ref.delete();
    return NextResponse.json({ ok: true, deleted: true });
  }

  if (action === "reject_removal") {
    if (prologue.platformStatus !== "removal_requested") {
      return jsonError("invalid_state", "삭제 요청 상태가 아닙니다.", 400);
    }
    await ref.update({
      platformStatus: "published",
      deletionRequest: FieldValue.delete(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    await recordAdminAudit(db, {
      actorUid: session.uid,
      action: "prologue_removal_reject",
      targetOwnerUid: ownerUid,
      targetWorkId: workId,
      targetType: "prologue",
      workTitle: work.title,
    });
    return NextResponse.json({ ok: true, platformStatus: "published" });
  }

  return jsonError("invalid_action", "알 수 없는 action 입니다.", 400);
}
