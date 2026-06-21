"use client";

import { useEffect, useState } from "react";
import { getCached, setCache } from "@/lib/feedCache";
import type { CatalogFeedItem, WorkSection } from "@/types/work";

export function useCatalogFeed(
  section: WorkSection,
  limit = 8,
  initialItems?: CatalogFeedItem[]
) {
  const cacheKey = `catalog:${section}:${limit}`;
  const cached = getCached<CatalogFeedItem[]>(cacheKey);

  const [items, setItems] = useState<CatalogFeedItem[]>(
    initialItems ?? cached ?? []
  );
  const [loading, setLoading] = useState(
    () => initialItems === undefined && cached === undefined
  );

  useEffect(() => {
    if (cached !== undefined) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/feed/works?section=${section}&limit=${limit}`);
        const data = (await res.json()) as { items?: CatalogFeedItem[] };
        if (!cancelled) {
          const fetched = data.items ?? [];
          setItems(fetched);
          setCache(cacheKey, fetched);
        }
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [section, limit, cacheKey, cached]);

  return { items, loading };
}
