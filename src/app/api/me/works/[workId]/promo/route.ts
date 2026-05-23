import { NextResponse } from "next/server";
import {
  aspectRatioFromVideo,
  createClip,
  deleteStreamVideo,
  getStreamVideo,
  resolvePlaybackUrl,
} from "@/lib/cloudflare/stream";
import { jsonError, requireUser } from "@/lib/server/api-auth";
import { parseRevisionReviewStatus } from "@/lib/server/revision-parse";
import { materializePromoFromDraft } from "@/lib/server/materialize-promo-draft";
import {
  syncPromoRevisionStreamStatusIfNeeded,
  syncPromoStreamStatusIfNeeded,
  syncWorkStreamStatusIfNeeded,
} from "@/lib/server/sync-stream-status";
import {
  canOwnerDeletePromo,
  FieldValue,
  getDbOrNull,
  parsePromoDoc,
  parseWorkDoc,
  promoRef,
  worksCol,
} from "@/lib/server/works";
import { PROMO_SHORT_DOC_ID } from "@/types/work";

type Params = { params: Promise<{ workId: string }> };

export async function GET(request: Request, { params }: Params) {
  const auth = await requireUser(request);
  if ("error" in auth) return auth.error;
  const { session } = auth;
  const { workId } = await params;

  const db = await getDbOrNull();
  if (!db) return jsonError("admin_not_configured", "서버 DB를 사용할 수 없습니다.", 503);

  const workSnap = await worksCol(db, session.uid).doc(workId).get();
  if (!workSnap.exists) return jsonError("not_found", "작품을 찾을 수 없습니다.", 404);

  let work = parseWorkDoc(workId, workSnap.data() as Record<string, unknown>);
  if (work.streamUid && work.streamStatus !== "ready" && work.streamStatus !== "error") {
    const synced = await syncWorkStreamStatusIfNeeded(
      db,
      session.uid,
      workId,
      work.streamUid,
      work.streamStatus
    );
    work = { ...work, streamStatus: synced };
  }
  if (work.streamStatus === "ready" && work.promoDraft) {
    await materializePromoFromDraft(db, session.uid, workId);
    const refreshed = await worksCol(db, session.uid).doc(workId).get();
    if (refreshed.exists) {
      work = parseWorkDoc(workId, refreshed.data() as Record<string, unknown>);
    }
  }
  const fullPlayback = work.streamUid ? await resolvePlaybackUrl(work.streamUid) : null;
  const fullInfo = work.streamUid ? await getStreamVideo(work.streamUid) : null;

  const promoSnap = await promoRef(db, session.uid, workId).get();
  let promo = null;
  let pendingRevision = null;
  let pendingRevisionPlayback: string | undefined;

  if (promoSnap.exists) {
    const raw = promoSnap.data() as Record<string, unknown>;
    let p = parsePromoDoc(raw);
    if (p.streamUid && p.streamStatus && p.streamStatus !== "ready" && p.streamStatus !== "error") {
      const synced = await syncPromoStreamStatusIfNeeded(
        db,
        session.uid,
        workId,
        p.streamUid,
        p.streamStatus
      );
      p = { ...p, streamStatus: synced ?? p.streamStatus };
    }

    if (p.pendingRevision?.streamUid && p.pendingRevision.streamStatus) {
      const revSynced = await syncPromoRevisionStreamStatusIfNeeded(
        db,
        session.uid,
        workId,
        p.pendingRevision.streamUid,
        p.pendingRevision.streamStatus
      );
      p = {
        ...p,
        pendingRevision: { ...p.pendingRevision, streamStatus: revSynced ?? p.pendingRevision.streamStatus },
      };
    }

    const promoPlayback =
      p.streamUid && p.streamStatus === "ready" ? await resolvePlaybackUrl(p.streamUid) : null;
    promo = { id: PROMO_SHORT_DOC_ID, ...p, playbackUrl: promoPlayback ?? undefined };

    if (p.pendingRevision) {
      pendingRevision = p.pendingRevision;
      if (
        p.pendingRevision.streamUid &&
        p.pendingRevision.streamStatus === "ready"
      ) {
        pendingRevisionPlayback =
          (await resolvePlaybackUrl(p.pendingRevision.streamUid)) ?? undefined;
      }
    }
  }

  const revisionMode = promo?.platformStatus === "published";

  return NextResponse.json({
    work: { ...work, playbackUrl: fullPlayback ?? undefined, durationSec: fullInfo?.duration },
    promo,
    revisionMode,
    pendingRevision,
    pendingRevisionPlayback,
    revisionReviewStatus: promoSnap.exists
      ? parseRevisionReviewStatus(promoSnap.data() as Record<string, unknown>)
      : undefined,
  });
}

export async function PUT(request: Request, { params }: Params) {
  const auth = await requireUser(request);
  if ("error" in auth) return auth.error;
  const { session } = auth;
  const { workId } = await params;

  let body: { clipStartSec?: number; clipEndSec?: number; title?: string; description?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return jsonError("invalid_json", "요청 형식이 올바르지 않습니다.", 400);
  }

  const start = Number(body.clipStartSec);
  const end = Number(body.clipEndSec);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start || end - start < 3) {
    return jsonError("invalid_clip", "클립 구간은 3초 이상이어야 합니다.", 400);
  }
  if (end - start > 120) {
    return jsonError("invalid_clip", "홍보 쇼츠는 최대 120초입니다.", 400);
  }

  const db = await getDbOrNull();
  if (!db) return jsonError("admin_not_configured", "서버 DB를 사용할 수 없습니다.", 503);

  const workSnap = await worksCol(db, session.uid).doc(workId).get();
  if (!workSnap.exists) return jsonError("not_found", "작품을 찾을 수 없습니다.", 404);

  const work = parseWorkDoc(workId, workSnap.data() as Record<string, unknown>);
  if (work.streamStatus !== "ready" || !work.streamUid) {
    return jsonError("not_ready", "풀 영상 인코딩이 끝난 후 쇼츠를 만들 수 있습니다.", 400);
  }

  const fullInfo = await getStreamVideo(work.streamUid);
  const duration = fullInfo?.duration ?? 600;
  if (end > duration + 0.5) {
    return jsonError("invalid_clip", "클립 끝이 영상 길이를 넘습니다.", 400);
  }

  const promoDocRef = promoRef(db, session.uid, workId);
  const existing = await promoDocRef.get();
  const existingData = existing.exists
    ? parsePromoDoc(existing.data() as Record<string, unknown>)
    : null;

  if (existingData?.platformStatus === "pending") {
    return jsonError("promo_locked", "심사 중인 쇼츠는 수정할 수 없습니다.", 403);
  }
  if (existingData?.revisionReviewStatus === "pending") {
    return jsonError("revision_pending", "수정본 심사가 끝난 후 다시 편집할 수 있습니다.", 403);
  }

  const isPublishedRevision = existingData?.platformStatus === "published";

  if (!isPublishedRevision && existingData?.streamUid) {
    try {
      await deleteStreamVideo(existingData.streamUid);
    } catch {
      /* ignore */
    }
  }

  if (isPublishedRevision && existingData.pendingRevision?.streamUid) {
    try {
      await deleteStreamVideo(existingData.pendingRevision.streamUid);
    } catch {
      /* ignore */
    }
  }

  let clipUid: string;
  const streamKind = isPublishedRevision ? "promo_revision" : "promo";
  try {
    const clip = await createClip({
      clippedFromVideoUID: work.streamUid,
      startTimeSeconds: start,
      endTimeSeconds: end,
      meta: {
        xiio_uid: session.uid,
        xiio_work_id: workId,
        xiio_kind: streamKind,
      },
    });
    clipUid = clip.uid;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return jsonError("stream_api_failed", msg, 502);
  }

  const clipTitle = body.title?.trim().slice(0, 200) || existingData?.title || work.title;
  const clipDescription =
    body.description?.trim() ||
    existingData?.description ||
    work.description ||
    null;
  const clipThumbnailUrl =
    existingData?.thumbnailUrl ?? work.promoDraft?.thumbnailUrl ?? null;

  if (isPublishedRevision) {
    await promoDocRef.set(
      {
        pendingRevision: {
          platformStatus: "draft",
          streamStatus: "processing",
          streamUid: clipUid,
          clipStartSec: start,
          clipEndSec: end,
          title: clipTitle,
          description: clipDescription,
          thumbnailUrl: clipThumbnailUrl,
          updatedAt: FieldValue.serverTimestamp(),
        },
        revisionReviewStatus: FieldValue.delete(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    return NextResponse.json({
      ok: true,
      revisionMode: true,
      streamUid: clipUid,
      streamStatus: "processing",
      clipStartSec: start,
      clipEndSec: end,
    });
  }

  await promoDocRef.set(
    {
      platformStatus: "draft",
      streamStatus: "processing",
      streamUid: clipUid,
      clipStartSec: start,
      clipEndSec: end,
      title: clipTitle,
      description: clipDescription,
      thumbnailUrl: clipThumbnailUrl,
      updatedAt: FieldValue.serverTimestamp(),
      ...(existing.exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
    },
    { merge: true }
  );

  return NextResponse.json({
    ok: true,
    streamUid: clipUid,
    platformStatus: "draft",
    streamStatus: "processing",
    clipStartSec: start,
    clipEndSec: end,
  });
}

export async function DELETE(request: Request, { params }: Params) {
  const auth = await requireUser(request);
  if ("error" in auth) return auth.error;
  const { session } = auth;
  const { workId } = await params;

  const db = await getDbOrNull();
  if (!db) return jsonError("admin_not_configured", "서버 DB를 사용할 수 없습니다.", 503);

  const ref = promoRef(db, session.uid, workId);
  const snap = await ref.get();
  if (!snap.exists) return jsonError("not_found", "홍보 쇼츠가 없습니다.", 404);

  const promo = parsePromoDoc(snap.data() as Record<string, unknown>);
  if (!canOwnerDeletePromo(promo.platformStatus)) {
    return jsonError("delete_forbidden", "게시된 쇼츠는 삭제 요청을 이용하세요.", 403);
  }

  if (promo.streamUid) {
    try {
      await deleteStreamVideo(promo.streamUid);
    } catch {
      /* ignore */
    }
  }

  await ref.delete();
  return NextResponse.json({ ok: true });
}
