import { NextResponse } from "next/server";
import { jsonError, requireUser } from "@/lib/server/api-auth";
import { FieldValue, getDbOrNull, parseWorkDoc, worksCol } from "@/lib/server/works";
import { defaultAspectRatioForSection, isVideoAspectRatio } from "@/lib/works/aspect-ratio";
import { isWorkSection } from "@/lib/works/constants";
import { normalizeContentCategory, normalizeTags } from "@/lib/works/label-utils";
import { syncWorkRevisionStreamStatusIfNeeded } from "@/lib/server/sync-stream-status";
import { resolvePlaybackUrl } from "@/lib/cloudflare/stream";

type Params = { params: Promise<{ workId: string }> };

export async function GET(request: Request, { params }: Params) {
  const auth = await requireUser(request);
  if ("error" in auth) return auth.error;
  const { session } = auth;
  const { workId } = await params;

  const db = await getDbOrNull();
  if (!db) return jsonError("admin_not_configured", "서버 DB를 사용할 수 없습니다.", 503);

  const snap = await worksCol(db, session.uid).doc(workId).get();
  if (!snap.exists) return jsonError("not_found", "작품을 찾을 수 없습니다.", 404);

  let work = parseWorkDoc(workId, snap.data() as Record<string, unknown>);
  if (work.platformStatus !== "published") {
    return jsonError("invalid_state", "게시된 작품만 수정할 수 있습니다.", 400);
  }

  const rev = work.pendingRevision;
  let revisionPlayback: string | undefined;
  if (rev?.streamUid && rev.streamStatus && rev.streamStatus !== "ready" && rev.streamStatus !== "error") {
    const synced = await syncWorkRevisionStreamStatusIfNeeded(
      db,
      session.uid,
      workId,
      rev.streamUid,
      rev.streamStatus
    );
    work = {
      ...work,
      pendingRevision: { ...rev, streamStatus: synced ?? rev.streamStatus },
    };
  }
  if (work.pendingRevision?.streamUid && work.pendingRevision.streamStatus === "ready") {
    revisionPlayback = (await resolvePlaybackUrl(work.pendingRevision.streamUid)) ?? undefined;
  }

  const livePlayback =
    work.streamUid && work.streamStatus === "ready"
      ? (await resolvePlaybackUrl(work.streamUid)) ?? undefined
      : undefined;

  return NextResponse.json({ work, livePlayback, revisionPlayback });
}

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireUser(request);
  if ("error" in auth) return auth.error;
  const { session } = auth;
  const { workId } = await params;

  let body: {
    title?: string;
    section?: string;
    contentCategory?: string;
    tags?: string[];
    director?: string;
    description?: string;
    aspectRatio?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return jsonError("invalid_json", "요청 형식이 올바르지 않습니다.", 400);
  }

  const db = await getDbOrNull();
  if (!db) return jsonError("admin_not_configured", "서버 DB를 사용할 수 없습니다.", 503);

  const ref = worksCol(db, session.uid).doc(workId);
  const snap = await ref.get();
  if (!snap.exists) return jsonError("not_found", "작품을 찾을 수 없습니다.", 404);

  const work = parseWorkDoc(workId, snap.data() as Record<string, unknown>);
  if (work.platformStatus !== "published") {
    return jsonError("invalid_state", "게시된 작품만 수정할 수 있습니다.", 400);
  }
  if (work.revisionReviewStatus === "pending") {
    return jsonError("revision_pending", "수정본 심사가 끝난 후 다시 편집할 수 있습니다.", 403);
  }

  const sectionRaw = body.section?.trim();
  const section =
    sectionRaw && isWorkSection(sectionRaw) ? sectionRaw : work.section;
  const proposedCategory = body.contentCategory
    ? normalizeContentCategory(body.contentCategory)
    : work.approvedCategory ?? work.proposedCategory ?? "";
  const proposedTags = normalizeTags(Array.isArray(body.tags) ? body.tags : work.approvedTags ?? []);

  const aspectRaw = body.aspectRatio?.trim();
  let proposedAspectRatio = work.approvedAspectRatio ?? work.proposedAspectRatio;
  if (aspectRaw) {
    if (!isVideoAspectRatio(aspectRaw)) {
      return jsonError("invalid_aspect_ratio", "유효하지 않은 화면 비율입니다.", 400);
    }
    proposedAspectRatio = aspectRaw;
  } else if (section !== work.section) {
    proposedAspectRatio = defaultAspectRatioForSection(section);
  }

  const existingRev = work.pendingRevision;
  const pendingRevision = {
    platformStatus: "draft" as const,
    streamUid: existingRev?.streamUid,
    streamStatus: existingRev?.streamStatus,
    section,
    title: (body.title ?? work.title).trim().slice(0, 200) || work.title,
    description: body.description?.trim() ?? work.description ?? undefined,
    director: body.director?.trim().slice(0, 120) ?? work.director ?? undefined,
    proposedCategory: proposedCategory || undefined,
    proposedTags: proposedTags.length > 0 ? proposedTags : undefined,
    proposedAspectRatio,
    updatedAt: FieldValue.serverTimestamp(),
  };

  await ref.update({
    pendingRevision,
    revisionReviewStatus: FieldValue.delete(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ ok: true, pendingRevision });
}
