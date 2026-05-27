import { NextResponse } from "next/server";
import { deleteStreamVideo, getStreamVideo, resolvePlaybackUrl } from "@/lib/cloudflare/stream";
import { jsonError, requireUser } from "@/lib/server/api-auth";
import { parseRevisionReviewStatus } from "@/lib/server/revision-parse";
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

  let body: { title?: string; description?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return jsonError("invalid_json", "요청 형식이 올바르지 않습니다.", 400);
  }

  const db = await getDbOrNull();
  if (!db) return jsonError("admin_not_configured", "서버 DB를 사용할 수 없습니다.", 503);

  const workSnap = await worksCol(db, session.uid).doc(workId).get();
  if (!workSnap.exists) return jsonError("not_found", "작품을 찾을 수 없습니다.", 404);

  const work = parseWorkDoc(workId, workSnap.data() as Record<string, unknown>);

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

  const metaTitle = body.title?.trim().slice(0, 200) || existingData?.title || work.promoDraft?.title || work.title;
  const metaDescription =
    body.description?.trim() ||
    existingData?.description ||
    work.promoDraft?.description ||
    work.description ||
    null;

  if (!existing.exists) {
    await promoDocRef.set(
      {
        platformStatus: "draft",
        title: metaTitle,
        description: metaDescription,
        thumbnailUrl: work.promoDraft?.thumbnailUrl ?? null,
        updatedAt: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  } else {
    const isPublishedRevision = existingData?.platformStatus === "published";
    if (isPublishedRevision && existingData?.pendingRevision) {
      await promoDocRef.set(
        {
          "pendingRevision.title": metaTitle,
          "pendingRevision.description": metaDescription,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    } else {
      await promoDocRef.set(
        {
          title: metaTitle,
          description: metaDescription,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }
  }

  if (work.promoDraft) {
    await worksCol(db, session.uid).doc(workId).update({
      "promoDraft.title": metaTitle,
      "promoDraft.description": metaDescription,
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  return NextResponse.json({ ok: true, title: metaTitle, description: metaDescription });
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
