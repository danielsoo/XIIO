"use client";

import { useEffect, useState } from "react";
import { loadSchoolsFeed, schoolsFeedCacheKey } from "@/lib/clientFeedLoaders";
import { getCached } from "@/lib/feedCache";
import type { SchoolListItem } from "@/types/school";

export function useSchoolsFeed(limit = 50, initialItems?: SchoolListItem[]) {
  const cacheKey = schoolsFeedCacheKey(limit);
  const cached = getCached<SchoolListItem[]>(cacheKey);
  const [items, setItems] = useState<SchoolListItem[]>(initialItems ?? cached ?? []);
  const [loading, setLoading] = useState(initialItems === undefined && cached === undefined);

  useEffect(() => {
    if (initialItems !== undefined) {
      setItems(initialItems);
      setLoading(false);
      return;
    }

    let cancelled = false;
    void loadSchoolsFeed(limit)
      .then((schools) => {
        if (!cancelled) setItems(schools);
      })
      .catch(() => {
        if (!cancelled && getCached<SchoolListItem[]>(cacheKey) === undefined) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [cacheKey, initialItems, limit]);

  return { items, loading };
}
