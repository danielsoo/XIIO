import type { Firestore } from "firebase-admin/firestore";
import { fetchSchoolWorksFeed } from "@/lib/server/school-feeds";
import type { CatalogFeedItem } from "@/types/work";

export function monthKeyUTC(d = new Date()): string {
  return d.toISOString().slice(0, 7);
}

function timestampToMonthKey(value: unknown): string | null {
  if (!value) return null;
  const maybeDate = value as { toDate?: () => Date };
  if (typeof maybeDate.toDate === "function") {
    return monthKeyUTC(maybeDate.toDate());
  }
  return null;
}

function engagementScore(item: CatalogFeedItem): number {
  return (item.viewCount ?? 0) + (item.likeCount ?? 0) * 3;
}

/**
 * 이달의 대표작 — 승자/패자 없이 학교별로 독립 선정.
 * 이달 발행된 작품 중 참여도(조회+좋아요) 최고작, 없으면 전체 기간 최고작으로 대체.
 */
export function pickSchoolRepresentativeWork(
  items: CatalogFeedItem[],
  monthKey: string = monthKeyUTC()
): CatalogFeedItem | null {
  if (items.length === 0) return null;

  const thisMonth = items.filter((i) => timestampToMonthKey(i.publishedAt) === monthKey);
  const pool = thisMonth.length > 0 ? thisMonth : items;

  return [...pool].sort((a, b) => engagementScore(b) - engagementScore(a))[0] ?? null;
}

export async function getSchoolRepresentativeWork(
  db: Firestore,
  schoolId: string,
  monthKey: string = monthKeyUTC()
): Promise<CatalogFeedItem | null> {
  const items = await fetchSchoolWorksFeed(db, schoolId, 60);
  return pickSchoolRepresentativeWork(items, monthKey);
}
