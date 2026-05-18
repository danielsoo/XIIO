import { NextResponse } from "next/server";
import { deleteStreamVideo, resolvePlaybackUrl } from "@/lib/cloudflare/stream";
import { jsonError, requireAdmin } from "@/lib/server/api-auth";
import { parseUserProfileDoc } from "@/lib/userAccess";
import {
  FieldValue,
  getDbOrNull,
  parsePromoDoc,
  parseWorkDoc,
  promoRef,
  worksCol,
} from "@/lib/server/works";
import { isVideoAspectRatio } from "@/lib/works/aspect-ratio";
import { isRejectReasonCode } from "@/lib/works/constants";
import type { VideoAspectRatio } from "@/types/work";
import { normalizeContentCategory, normalizeTags } from "@/lib/works/label-utils";
import { PROMO_SHORT_DOC_ID } from "@/types/work";
import type { AdminWorkDetail } from "@/types/admin";

type Params = { params: Promise<{ ownerUid: string; workId: string }> };

export async function GET(request: Request, { params }: Params) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  const { ownerUid, workId } = await params;
  const db = await getDbOrNull();
  if (!db) return jsonError("admin_not_configured", "서버 DB를 사용할 수 없습니다.", 503);

  const ref = worksCol(db, ownerUid).doc(workId);
  const snap = await ref.get();
  if (!snap.exists) return jsonError("not_found", "작품을 찾을 수 없습니다.", 404);

  const work = parseWorkDoc(workId, snap.data() as Record<string, unknown>);
  const userSnap = await db.collection("users").doc(ownerUid).get();
  const ownerProfile = userSnap.exists
    ? parseUserProfileDoc(userSnap.data() as Record<string, unknown>)
    : null;

  const playbackUrl =
    work.streamUid && work.streamStatus === "ready"
      ? await resolvePlaybackUrl(work.streamUid)
      : undefined;

  const promoSnap = await promoRef(db, ownerUid, workId).get();
  let promo: AdminWorkDetail["promo"];
  if (promoSnap.exists) {
    const parsed = parsePromoDoc(promoSnap.data() as Record<string, unknown>);
    const promoPlayback =
      parsed.streamUid && parsed.streamStatus === "ready"
        ? await resolvePlaybackUrl(parsed.streamUid)
        : undefined;
    promo = {
      id: PROMO_SHORT_DOC_ID,
      platformStatus: parsed.platformStatus,
      streamStatus: parsed.streamStatus,
      clipStartSec: parsed.clipStartSec,
      clipEndSec: parsed.clipEndSec,
      title: parsed.title,
      playbackUrl: promoPlayback ?? undefined,
      deletionRequest: parsed.deletionRequest,
      rejectReason: parsed.rejectReason,
    };
  }

  const detail: AdminWorkDetail = {
    work,
    owner: {
      uid: ownerUid,
      email: ownerProfile?.email ?? null,
      displayName: ownerProfile?.displayName ?? ownerUid,
    },
    playbackUrl: playbackUrl ?? undefined,
    promo,
  };

  return NextResponse.json(detail);
}

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;
  const { session } = auth;
  const { ownerUid, workId } = await params;

  let body: {
    action?: string;
    rejectReason?: string;
    rejectReasonCode?: string;
    approvedCategory?: string;
    approvedTags?: string[];
    approvedAspectRatio?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return jsonError("invalid_json", "요청 형식이 올바르지 않습니다.", 400);
  }

  const action = body.action;
  if (!action) return jsonError("action_required", "action이 필요합니다.", 400);

  const db = await getDbOrNull();
  if (!db) return jsonError("admin_not_configured", "서버 DB를 사용할 수 없습니다.", 503);

  const ref = worksCol(db, ownerUid).doc(workId);
  const snap = await ref.get();
  if (!snap.exists) return jsonError("not_found", "작품을 찾을 수 없습니다.", 404);

  const work = parseWorkDoc(workId, snap.data() as Record<string, unknown>);

  if (action === "approve") {
    if (work.streamStatus !== "ready") {
      return jsonError("not_ready", "인코딩이 완료된 후 승인할 수 있습니다.", 400);
    }

    const approvedCategoryRaw =
      body.approvedCategory?.trim() || work.proposedCategory?.trim() || "";
    const approvedCategory = approvedCategoryRaw
      ? normalizeContentCategory(approvedCategoryRaw)
      : null;
    const tagSource =
      Array.isArray(body.approvedTags) && body.approvedTags.length > 0
        ? body.approvedTags
        : (work.proposedTags ?? []);
    const approvedTags = normalizeTags(tagSource);

    const aspectBody = body.approvedAspectRatio?.trim();
    let approvedAspectRatio: VideoAspectRatio | null = work.proposedAspectRatio ?? null;
    if (aspectBody) {
      if (!isVideoAspectRatio(aspectBody)) {
        return jsonError("invalid_aspect_ratio", "유효하지 않은 화면 비율입니다.", 400);
      }
      approvedAspectRatio = aspectBody;
    }

    await ref.update({
      platformStatus: "published",
      approvedCategory,
      approvedTags: approvedTags.length > 0 ? approvedTags : null,
      approvedAspectRatio,
      publishedAt: FieldValue.serverTimestamp(),
      reviewedAt: FieldValue.serverTimestamp(),
      reviewedBy: session.uid,
      rejectReason: FieldValue.delete(),
      rejectReasonCode: FieldValue.delete(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return NextResponse.json({ ok: true, platformStatus: "published" });
  }

  if (action === "reject") {
    const code = body.rejectReasonCode?.trim();
    if (!code || !isRejectReasonCode(code)) {
      return jsonError("reject_reason_code_required", "반려 사유를 선택해 주세요.", 400);
    }
    const reason =
      (body.rejectReason ?? "").trim().slice(0, 500) ||
      (code === "category_mismatch"
        ? "카테고리 부적합"
        : code === "tag_mismatch"
          ? "태그 부적합"
          : "반려됨");

    await ref.update({
      platformStatus: "rejected",
      rejectReasonCode: code,
      rejectReason: reason,
      reviewedAt: FieldValue.serverTimestamp(),
      reviewedBy: session.uid,
      updatedAt: FieldValue.serverTimestamp(),
    });
    return NextResponse.json({ ok: true, platformStatus: "rejected" });
  }

  if (action === "approve_removal") {
    if (work.platformStatus !== "removal_requested") {
      return jsonError("invalid_state", "삭제 요청 상태가 아닙니다.", 400);
    }
    const promoSnap = await promoRef(db, ownerUid, workId).get();
    if (promoSnap.exists) {
      const promoUid = promoSnap.data()?.streamUid as string | undefined;
      if (promoUid) {
        try {
          await deleteStreamVideo(promoUid);
        } catch {
          /* ignore */
        }
      }
      await promoRef(db, ownerUid, workId).delete();
    }
    if (work.streamUid) {
      try {
        await deleteStreamVideo(work.streamUid);
      } catch {
        /* ignore */
      }
    }
    await ref.delete();
    return NextResponse.json({ ok: true, deleted: true });
  }

  if (action === "reject_removal") {
    if (work.platformStatus !== "removal_requested") {
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
