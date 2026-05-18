import { NextResponse } from "next/server";
import {
  aspectRatioFromVideo,
  getStreamVideo,
  resolvePlaybackUrl,
} from "@/lib/cloudflare/stream";
import { getDbOrNull, parsePromoDoc, parseWorkDoc, worksCol } from "@/lib/server/works";
import type { PromoFeedItem } from "@/types/work";

export async function GET() {
  const db = await getDbOrNull();
  if (!db) {
    return NextResponse.json({ items: [] });
  }

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

    items.push({
      id: `${ownerUid}_${workId}`,
      workId,
      ownerUid,
      title: promo.title ?? work.title,
      director: work.director ?? "—",
      description: promo.description ?? work.description ?? "",
      videoUrl,
      aspectRatio: aspectRatioFromVideo(info),
      likeCount: 0,
    });
  }

  items.sort((a, b) => a.title.localeCompare(b.title));

  return NextResponse.json({ items });
}
