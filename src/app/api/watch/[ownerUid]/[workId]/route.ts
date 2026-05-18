import { NextResponse } from "next/server";
import { getStreamEmbedUrl, getStreamVideo, resolvePlaybackUrl } from "@/lib/cloudflare/stream";
import { getDbOrNull, parseWorkDoc, worksCol } from "@/lib/server/works";
import type { PublicWorkWatch } from "@/types/watch";

type Params = { params: Promise<{ ownerUid: string; workId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { ownerUid, workId } = await params;

  const db = await getDbOrNull();
  if (!db) {
    return NextResponse.json({ error: "not_available", message: "서비스를 사용할 수 없습니다." }, { status: 503 });
  }

  const snap = await worksCol(db, ownerUid).doc(workId).get();
  if (!snap.exists) {
    return NextResponse.json({ error: "not_found", message: "작품을 찾을 수 없습니다." }, { status: 404 });
  }

  const work = parseWorkDoc(workId, snap.data() as Record<string, unknown>);

  if (work.platformStatus !== "published") {
    return NextResponse.json({ error: "not_found", message: "공개된 작품이 아닙니다." }, { status: 404 });
  }

  if (work.streamStatus !== "ready" || !work.streamUid) {
    return NextResponse.json(
      { error: "not_ready", message: "영상을 재생할 수 없습니다. 인코딩 중이거나 오류가 있습니다." },
      { status: 404 }
    );
  }

  const playbackUrl = await resolvePlaybackUrl(work.streamUid);
  const info = await getStreamVideo(work.streamUid);

  const payload: PublicWorkWatch = {
    workId,
    ownerUid,
    title: work.title,
    description: work.description,
    director: work.director,
    section: work.section,
    approvedCategory: work.approvedCategory,
    approvedTags: work.approvedTags ?? [],
    approvedAspectRatio: work.approvedAspectRatio,
    playbackUrl,
    embedUrl: getStreamEmbedUrl(work.streamUid),
    thumbnailUrl: info?.thumbnail,
  };

  return NextResponse.json(payload);
}
