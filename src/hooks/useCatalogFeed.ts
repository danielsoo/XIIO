"use client";

import { useEffect, useState } from "react";
import type { CatalogFeedItem, WorkSection } from "@/types/work";

export function useCatalogFeed(section: WorkSection, limit = 8) {
  const [items, setItems] = useState<CatalogFeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/feed/works?section=${section}&limit=${limit}`);
        const data = (await res.json()) as { items?: CatalogFeedItem[] };
        if (!cancelled) setItems(data.items ?? []);
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [section, limit]);

  return { items, loading };
}
