import { NextResponse } from "next/server";
import {
  aspectRatioFromVideo,
  getPlaybackUrl,
  getStreamThumbnailUrl,
  getStreamVideo,
} from "@/lib/cloudflare/stream";
import { isPromoLiked } from "@/lib/server/engagement";
import { verifyBearerIdToken } from "@/lib/server/firebase-admin";
import { getDbOrNull, parsePromoDoc, parseWorkDoc, worksCol } from "@/lib/server/works";
import type { PromoFeedItem } from "@/types/work";

export async function GET(request: Request) {
  const db = await getDbOrNull();
  if (!db) {
    return NextResponse.json({ items: [] });
  }

  const session = await verifyBearerIdToken(request.headers.get("authorization"));
  const viewerUid = session?.uid ?? null;

  const promoSnap = await db
    .collectionGroup("promoShort")
    .where("platformStatus", "==", "published")
    .get();

  const rows = await Promise.all(
    promoSnap.docs.map(async (promoDoc) => {
      const promo = parsePromoDoc(promoDoc.data() as Record<string, unknown>);
      if (promo.streamStatus !== "ready" || !promo.streamUid) return null;

      const workRef = promoDoc.ref.parent.parent;
      if (!workRef) return null;
      const workId = workRef.id;
      const ownerUid = workRef.parent.parent?.id;
      if (!ownerUid) return null;

      const workSnap = await worksCol(db, ownerUid).doc(workId).get();
      if (!workSnap.exists) return null;
      const work = parseWorkDoc(workId, workSnap.data() as Record<string, unknown>);

      const info = await getStreamVideo(promo.streamUid);
      const videoUrl = getPlaybackUrl(promo.streamUid) ?? info?.playbackHls ?? null;
      if (!videoUrl) return null;

      let likedByMe = false;
      if (viewerUid) {
        likedByMe = await isPromoLiked(db, viewerUid, ownerUid, workId);
      }

      const thumbnailUrl =
        promo.thumbnailUrl ??
        work.promoDraft?.thumbnailUrl ??
        info?.thumbnail ??
        getStreamThumbnailUrl(promo.streamUid) ??
        undefined;

      const feedItem: PromoFeedItem = {
        id: `${ownerUid}_${workId}`,
        workId,
        ownerUid,
        title: promo.title ?? work.title,
        director: work.director ?? "—",
        description: promo.description ?? work.description ?? "",
        videoUrl,
        streamUid: promo.streamUid,
        thumbnailUrl,
        aspectRatio: aspectRatioFromVideo(info),
        likeCount: promo.likeCount ?? 0,
        viewCount: promo.viewCount ?? 0,
        likedByMe,
      };
      return feedItem;
    })
  );

  const items = rows.filter((row): row is PromoFeedItem => row !== null);
  items.sort((a, b) => a.title.localeCompare(b.title));

  return NextResponse.json(
    { items },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    }
  );
}
