import { NextResponse } from "next/server";
import {
  aspectRatioFromVideo,
  createClip,
  deleteStreamVideo,
  getStreamVideo,
  resolvePlaybackUrl,
} from "@/lib/cloudflare/stream";
import { jsonError, requireUser } from "@/lib/server/api-auth";
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

  const work = parseWorkDoc(workId, workSnap.data() as Record<string, unknown>);
  const fullPlayback = work.streamUid ? await resolvePlaybackUrl(work.streamUid) : null;
  const fullInfo = work.streamUid ? await getStreamVideo(work.streamUid) : null;

  const promoSnap = await promoRef(db, session.uid, workId).get();
  let promo = null;
  if (promoSnap.exists) {
    const p = parsePromoDoc(promoSnap.data() as Record<string, unknown>);
    const promoPlayback =
      p.streamUid && p.streamStatus === "ready" ? await resolvePlaybackUrl(p.streamUid) : null;
    promo = { id: PROMO_SHORT_DOC_ID, ...p, playbackUrl: promoPlayback ?? undefined };
  }

  return NextResponse.json({
    work: { ...work, playbackUrl: fullPlayback ?? undefined, durationSec: fullInfo?.duration },
    promo,
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
  if (existing.exists) {
    const existingData = parsePromoDoc(existing.data() as Record<string, unknown>);
    if (existingData.platformStatus === "published" || existingData.platformStatus === "pending") {
      return jsonError("promo_locked", "심사 중이거나 게시된 쇼츠는 수정할 수 없습니다.", 403);
    }
    const oldUid = existingData.streamUid;
    if (oldUid) {
      try {
        await deleteStreamVideo(oldUid);
      } catch {
        /* ignore */
      }
    }
  }

  let clipUid: string;
  try {
    const clip = await createClip({
      clippedFromVideoUID: work.streamUid,
      startTimeSeconds: start,
      endTimeSeconds: end,
      meta: {
        xiio_uid: session.uid,
        xiio_work_id: workId,
        xiio_kind: "promo",
      },
    });
    clipUid = clip.uid;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return jsonError("stream_api_failed", msg, 502);
  }

  await promoDocRef.set(
    {
      platformStatus: "draft",
      streamStatus: "processing",
      streamUid: clipUid,
      clipStartSec: start,
      clipEndSec: end,
      title: body.title?.trim().slice(0, 200) || work.title,
      description: body.description?.trim().slice(0, 2000) || work.description || null,
      updatedAt: FieldValue.serverTimestamp(),
      ...(existing.exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
    },
    { merge: true }
  );

  return NextResponse.json({ ok: true, streamUid: clipUid, platformStatus: "draft" });
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
