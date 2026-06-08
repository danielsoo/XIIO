import type { Firestore } from "firebase-admin/firestore";
import {
  appendPlaybackBandwidthHint,
  getPlaybackUrl,
  getStreamThumbnailUrl,
  STREAM_TEASER_BANDWIDTH_HINT_MBPS,
} from "@/lib/cloudflare/stream";
import { isPromoLiked } from "@/lib/server/engagement";
import { syncWorkStreamStatusIfNeeded } from "@/lib/server/sync-stream-status";
import {
  getDbOrNull,
  parsePromoDoc,
  parseWorkDoc,
  promoRef,
  resolveWorkListThumbnailUrl,
  worksCol,
} from "@/lib/server/works";
import type { CatalogFeedItem, PromoFeedItem, WorkSection } from "@/types/work";
import { isWorkSection } from "@/lib/works/constants";

export const FEED_CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
} as const;

const DEFAULT_PROMO_ASPECT_RATIO = 16 / 9;

export async function fetchPromoShortsFeed(
  db: Firestore,
  viewerUid: string | null = null
): Promise<PromoFeedItem[]> {
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

      const rawPlayback = getPlaybackUrl(promo.streamUid, {
        clientBandwidthHintMbps: STREAM_TEASER_BANDWIDTH_HINT_MBPS,
      });
      const videoUrl = rawPlayback
        ? appendPlaybackBandwidthHint(rawPlayback, STREAM_TEASER_BANDWIDTH_HINT_MBPS)
        : null;
      if (!videoUrl) return null;

      let likedByMe = false;
      if (viewerUid) {
        likedByMe = await isPromoLiked(db, viewerUid, ownerUid, workId);
      }

      const thumbnailUrl =
        promo.thumbnailUrl ??
        work.promoDraft?.thumbnailUrl ??
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
        aspectRatio: DEFAULT_PROMO_ASPECT_RATIO,
        frameCrop: promo.frameCrop,
        likeCount: promo.likeCount ?? 0,
        viewCount: promo.viewCount ?? 0,
        likedByMe,
      };
      return feedItem;
    })
  );

  const items = rows.filter((row): row is PromoFeedItem => row !== null);
  items.sort((a, b) => a.title.localeCompare(b.title));
  return items;
}

export async function fetchCatalogWorksFeed(
  db: Firestore,
  section: WorkSection,
  limit = 8
): Promise<CatalogFeedItem[]> {
  const cappedLimit = Math.min(24, Math.max(1, limit));

  const snap = await db
    .collectionGroup("works")
    .where("platformStatus", "==", "published")
    .limit(80)
    .get();

  const items: CatalogFeedItem[] = [];

  for (const doc of snap.docs) {
    if (items.length >= cappedLimit) break;

    const ownerUid = doc.ref.parent.parent?.id;
    if (!ownerUid) continue;

    let work = parseWorkDoc(doc.id, doc.data() as Record<string, unknown>);
    if (work.section !== section) continue;
    if (work.streamUid) {
      const synced = await syncWorkStreamStatusIfNeeded(
        db,
        ownerUid,
        doc.id,
        work.streamUid,
        work.streamStatus
      );
      work = { ...work, streamStatus: synced };
    }
    if (work.streamStatus !== "ready") continue;

    const thumbnailUrl = await resolveWorkListThumbnailUrl(db, ownerUid, doc.id, work);
    const promoSnap = await promoRef(db, ownerUid, doc.id).get();
    const promo = promoSnap.exists
      ? parsePromoDoc(promoSnap.data() as Record<string, unknown>)
      : null;
    const thumbnailCrop = promo?.thumbnailCrop ?? work.promoDraft?.thumbnailCrop;

    items.push({
      id: `${ownerUid}_${doc.id}`,
      workId: doc.id,
      ownerUid,
      title: work.title,
      director: work.director,
      section: work.section,
      approvedCategory: work.approvedCategory,
      approvedTags: work.approvedTags ?? [],
      thumbnailUrl,
      ...(thumbnailCrop ? { thumbnailCrop } : {}),
    });
  }

  items.sort((a, b) => a.title.localeCompare(b.title));
  return items;
}

export type ServerHomeFeeds = {
  promoItems: PromoFeedItem[];
  movies: CatalogFeedItem[];
  series: CatalogFeedItem[];
};

export async function getServerHomeFeeds(): Promise<ServerHomeFeeds> {
  const db = await getDbOrNull();
  if (!db) {
    return { promoItems: [], movies: [], series: [] };
  }

  const [promoItems, movies, series] = await Promise.all([
    fetchPromoShortsFeed(db),
    fetchCatalogWorksFeed(db, "movies", 8),
    fetchCatalogWorksFeed(db, "series", 4),
  ]);

  return { promoItems, movies, series };
}

export function parseCatalogSection(
  sectionParam: string | null
): WorkSection | null {
  if (!sectionParam || !isWorkSection(sectionParam)) return null;
  return sectionParam;
}
