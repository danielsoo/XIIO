import { NextResponse } from "next/server";
import { deleteStreamVideo, getStreamVideo, resolvePlaybackUrl } from "@/lib/cloudflare/stream";
import { jsonError, requireUser } from "@/lib/server/api-auth";
import { parseRevisionReviewStatus } from "@/lib/server/revision-parse";
import {
  syncPrologueRevisionStreamStatusIfNeeded,
  syncPrologueStreamStatusIfNeeded,
  syncWorkStreamStatusIfNeeded,
} from "@/lib/server/sync-stream-status";
import {
  canOwnerDeletePrologue,
  FieldValue,
  getDbOrNull,
  parsePrologueDoc,
  parseWorkDoc,
  prologueRef,
  worksCol,
} from "@/lib/server/works";
import { PROLOGUE_SHORT_DOC_ID } from "@/types/work";

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
  if (
    work.streamUid &&
    work.streamStatus !== "staged" &&
    work.streamStatus !== "ready" &&
    work.streamStatus !== "error"
  ) {
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

  const prologueSnap = await prologueRef(db, session.uid, workId).get();
  let prologue = null;
  let pendingRevision = null;
  let pendingRevisionPlayback: string | undefined;

  if (prologueSnap.exists) {
    const raw = prologueSnap.data() as Record<string, unknown>;
    let p = parsePrologueDoc(raw);
    if (p.streamUid && p.streamStatus && p.streamStatus !== "ready" && p.streamStatus !== "error") {
      const synced = await syncPrologueStreamStatusIfNeeded(
        db,
        session.uid,
        workId,
        p.streamUid,
        p.streamStatus
      );
      p = { ...p, streamStatus: synced ?? p.streamStatus };
    }

    if (p.pendingRevision?.streamUid && p.pendingRevision.streamStatus) {
      const revSynced = await syncPrologueRevisionStreamStatusIfNeeded(
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

    const playback =
      p.streamUid && p.streamStatus === "ready" ? await resolvePlaybackUrl(p.streamUid) : null;
    prologue = { id: PROLOGUE_SHORT_DOC_ID, ...p, playbackUrl: playback ?? undefined };

    if (p.pendingRevision) {
      pendingRevision = p.pendingRevision;
      if (p.pendingRevision.streamUid && p.pendingRevision.streamStatus === "ready") {
        pendingRevisionPlayback =
          (await resolvePlaybackUrl(p.pendingRevision.streamUid)) ?? undefined;
      }
    }
  }

  const revisionMode = prologue?.platformStatus === "published";

  return NextResponse.json({
    work: { ...work, playbackUrl: fullPlayback ?? undefined, durationSec: fullInfo?.duration },
    prologue,
    revisionMode,
    pendingRevision,
    pendingRevisionPlayback,
    revisionReviewStatus: prologueSnap.exists
      ? parseRevisionReviewStatus(prologueSnap.data() as Record<string, unknown>)
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
  const prologueDocRef = prologueRef(db, session.uid, workId);
  const existing = await prologueDocRef.get();
  const existingData = existing.exists
    ? parsePrologueDoc(existing.data() as Record<string, unknown>)
    : null;

  if (existingData?.platformStatus === "pending") {
    return jsonError("prologue_locked", "심사 중인 프롤로그는 수정할 수 없습니다.", 403);
  }
  if (existingData?.revisionReviewStatus === "pending") {
    return jsonError("revision_pending", "수정본 심사가 끝난 후 다시 편집할 수 있습니다.", 403);
  }

  const metaTitle =
    body.title?.trim().slice(0, 200) ||
    existingData?.title ||
    work.prologueDraft?.title ||
    work.title;
  const metaDescription =
    body.description?.trim() ||
    existingData?.description ||
    work.prologueDraft?.description ||
    work.description ||
    null;

  if (!existing.exists) {
    await prologueDocRef.set(
      {
        platformStatus: "draft",
        title: metaTitle,
        description: metaDescription,
        updatedAt: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  } else {
    const isPublishedRevision = existingData?.platformStatus === "published";
    if (isPublishedRevision && existingData?.pendingRevision) {
      await prologueDocRef.set(
        {
          "pendingRevision.title": metaTitle,
          "pendingRevision.description": metaDescription,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    } else {
      await prologueDocRef.set(
        {
          title: metaTitle,
          description: metaDescription,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }
  }

  if (work.prologueDraft) {
    await worksCol(db, session.uid).doc(workId).update({
      "prologueDraft.title": metaTitle,
      "prologueDraft.description": metaDescription,
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

  const ref = prologueRef(db, session.uid, workId);
  const snap = await ref.get();
  if (!snap.exists) return jsonError("not_found", "프롤로그가 없습니다.", 404);

  const prologue = parsePrologueDoc(snap.data() as Record<string, unknown>);
  if (!canOwnerDeletePrologue(prologue.platformStatus)) {
    return jsonError("delete_forbidden", "게시된 프롤로그는 삭제 요청을 이용하세요.", 403);
  }

  if (prologue.streamUid) {
    try {
      await deleteStreamVideo(prologue.streamUid);
    } catch {
      /* ignore */
    }
  }

  await ref.delete();
  return NextResponse.json({ ok: true });
}
