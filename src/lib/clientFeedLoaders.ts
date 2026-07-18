import { getOrLoadCached } from "@/lib/feedCache";
import type { SchoolListItem } from "@/types/school";
import type { CatalogFeedItem, WorkSection } from "@/types/work";

export function normalizedCatalogLimit(limit: number): number {
  return limit <= 12 ? 12 : limit;
}

export function catalogFeedCacheKey(section: WorkSection, limit: number): string {
  // v3 replaces the small first-pass CDN thumbnails with retina-ready derivatives.
  return `catalog:v3:${section}:${normalizedCatalogLimit(limit)}`;
}

type ThumbnailItem = { thumbnailUrl?: string };

function preloadImage(url: string): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();

  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve();
    image.onerror = () => resolve();
    image.src = url;
  });
}

/**
 * Keep the already-rendered shell/fallback artwork visible until lightweight
 * CDN thumbnails are in the browser cache. A timeout prevents a bad asset from
 * holding the feed indefinitely.
 */
export async function preloadFeedThumbnails<T extends ThumbnailItem>(
  items: T[],
  timeoutMs = 3_500
): Promise<T[]> {
  const urls = Array.from(
    new Set(items.map((item) => item.thumbnailUrl).filter((url): url is string => Boolean(url)))
  );
  if (urls.length === 0 || typeof window === "undefined") return items;

  await Promise.race([
    Promise.all(urls.map(preloadImage)),
    new Promise<void>((resolve) => window.setTimeout(resolve, timeoutMs)),
  ]);
  return items;
}

export function loadCatalogFeed(section: WorkSection, limit: number) {
  const fetchLimit = normalizedCatalogLimit(limit);
  const cacheKey = catalogFeedCacheKey(section, limit);
  return getOrLoadCached(cacheKey, async () => {
    const response = await fetch(`/api/feed/works?section=${section}&limit=${fetchLimit}`);
    if (!response.ok) throw new Error("catalog_feed_failed");
    const data = (await response.json()) as { items?: CatalogFeedItem[] };
    return preloadFeedThumbnails(data.items ?? []);
  });
}

export function schoolsFeedCacheKey(limit: number): string {
  return `schools:${limit}`;
}

export function loadSchoolsFeed(limit: number) {
  const cacheKey = schoolsFeedCacheKey(limit);
  return getOrLoadCached(cacheKey, async () => {
    const response = await fetch(`/api/schools?limit=${limit}`);
    if (!response.ok) throw new Error("schools_feed_failed");
    const data = (await response.json()) as { schools?: SchoolListItem[] };
    return data.schools ?? [];
  });
}
