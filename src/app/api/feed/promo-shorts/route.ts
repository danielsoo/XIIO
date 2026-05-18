import { NextResponse } from "next/server";
import {
  aspectRatioFromVideo,
  getStreamVideo,
  resolvePlaybackUrl,
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

  const promoSnap = await db.collectionGroup("promoShort").where("platformStatus", "==", "published").get();

  const items: PromoFeedItem[] = [];

  for (const promoDoc of promoSnap.docs) {
    const promo = parsePromoDoc(promoDoc.data() as Record<string, unknown>);
    if (promo.streamStatus !== "ready" || !promo.streamUid) continue;

    const workRef = promoDoc.ref.parent.parent;
    if (!workRef) continue;
    const workId = workRef.id;
    const ownerUid = workRef.parent.parent?.id;
    if (!ownerUid) continue;

    const workSnap = await worksCol(db, ownerUid).doc(workId).get();
    if (!workSnap.exists) continue;
    const work = parseWorkDoc(workId, workSnap.data() as Record<string, unknown>);

    const videoUrl = await resolvePlaybackUrl(promo.streamUid);
    if (!videoUrl) continue;

    const info = await getStreamVideo(promo.streamUid);

    let likedByMe = false;
    if (viewerUid) {
      likedByMe = await isPromoLiked(db, viewerUid, ownerUid, workId);
    }

    items.push({
      id: `${ownerUid}_${workId}`,
      workId,
      ownerUid,
      title: promo.title ?? work.title,
      director: work.director ?? "—",
      description: promo.description ?? work.description ?? "",
      videoUrl,
      aspectRatio: aspectRatioFromVideo(info),
      likeCount: promo.likeCount ?? 0,
      viewCount: promo.viewCount ?? 0,
      likedByMe,
    });
  }

  items.sort((a, b) => a.title.localeCompare(b.title));

  return NextResponse.json({ items });
}
