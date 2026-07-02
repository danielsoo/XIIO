import type { Firestore } from "firebase-admin/firestore";
import { syncWorkStreamStatusIfNeeded } from "@/lib/server/sync-stream-status";
import {
  getDbOrNull,
  parsePromoDoc,
  parseWorkDoc,
  promoRef,
  resolveWorkListThumbnailUrl,
  worksCol,
} from "@/lib/server/works";
import { collectSchoolsForSuggestions, parseSchoolDoc, schoolsCol } from "@/lib/server/schools";
import type { CatalogFeedItem } from "@/types/work";
import type { SchoolListItem, SchoolStats } from "@/types/school";

const SCHOOL_WORKS_SCAN_LIMIT = 300;

/** 학교 페이지 배경 — 홈 fetchCatalogWorksFeed와 동일하게 published works를 스캔 후 학교로 필터 */
export async function fetchSchoolWorksFeed(
  db: Firestore,
  schoolId: string,
  limit = 24
): Promise<CatalogFeedItem[]> {
  const cappedLimit = Math.min(60, Math.max(1, limit));

  const snap = await db
    .collectionGroup("works")
    .where("platformStatus", "==", "published")
    .limit(SCHOOL_WORKS_SCAN_LIMIT)
    .get();

  const items: CatalogFeedItem[] = [];

  for (const doc of snap.docs) {
    const ownerUid = doc.ref.parent.parent?.id;
    if (!ownerUid) continue;

    let work = parseWorkDoc(doc.id, doc.data() as Record<string, unknown>);
    if (work.approvedSchoolId !== schoolId) continue;
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
      approvedSchoolId: work.approvedSchoolId,
      approvedSchoolName: work.approvedSchoolName,
      thumbnailUrl,
      ...(thumbnailCrop ? { thumbnailCrop } : {}),
      viewCount: work.viewCount ?? 0,
      likeCount: work.likeCount ?? 0,
      publishedAt: work.publishedAt,
    });
  }

  return items.slice(0, cappedLimit);
}

export function computeSchoolStats(items: CatalogFeedItem[]): SchoolStats {
  return {
    workCount: items.length,
    movieCount: items.filter((i) => i.section === "movies").length,
    seriesCount: items.filter((i) => i.section === "series").length,
    entertainmentCount: items.filter((i) => i.section === "entertainment").length,
  };
}

function timestampMillis(value: unknown): number {
  const maybe = value as { toMillis?: () => number };
  return typeof maybe?.toMillis === "function" ? maybe.toMillis() : 0;
}

export function sortByPublishedAtDesc(items: CatalogFeedItem[]): CatalogFeedItem[] {
  return [...items].sort((a, b) => timestampMillis(b.publishedAt) - timestampMillis(a.publishedAt));
}

export function sortByViewCountDesc(items: CatalogFeedItem[]): CatalogFeedItem[] {
  return [...items].sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0));
}

export async function fetchSchool(db: Firestore, schoolId: string): Promise<SchoolListItem | null> {
  const snap = await schoolsCol(db).doc(schoolId).get();
  if (!snap.exists) return null;
  return parseSchoolDoc(snap.id, snap.data() as Record<string, unknown>);
}

/** /schools 랭킹 — 발행 작품 수 기준 (denormalized workCount 카운터 사용) */
export async function fetchSchoolsRanking(db: Firestore, limit = 50): Promise<SchoolListItem[]> {
  const all = await collectSchoolsForSuggestions(db);
  return all
    .filter((s) => s.status === "active")
    .sort((a, b) => (b.workCount ?? 0) - (a.workCount ?? 0))
    .slice(0, limit);
}

export async function getServerSchoolFeed(schoolId: string) {
  const db = await getDbOrNull();
  if (!db) return { school: null, items: [] as CatalogFeedItem[], stats: computeSchoolStats([]) };

  const [school, items] = await Promise.all([
    fetchSchool(db, schoolId),
    fetchSchoolWorksFeed(db, schoolId),
  ]);

  return { school, items, stats: computeSchoolStats(items) };
}
