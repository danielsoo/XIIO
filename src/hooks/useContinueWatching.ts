"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getCached, getOrLoadCached } from "@/lib/feedCache";
import type { WatchProgressItem } from "@/types/work";

export function useContinueWatching() {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<WatchProgressItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const cacheKey = `watch-progress:${user.uid}`;
    const cached = getCached<WatchProgressItem[]>(cacheKey);
    if (cached) {
      setItems(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }
    void (async () => {
      try {
        const next = await getOrLoadCached(cacheKey, async () => {
          const token = await user.getIdToken();
          const res = await fetch("/api/me/watch-progress", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) throw new Error("watch_progress_failed");
          const data = (await res.json().catch(() => ({}))) as { items?: WatchProgressItem[] };
          return data.items ?? [];
        });
        if (!cancelled) setItems(next);
      } catch {
        if (!cancelled && cached === undefined) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, user]);

  return { items, loading };
}
