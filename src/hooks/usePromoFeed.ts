"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getCached, setCache } from "@/lib/feedCache";
import { HOME_PROMO_SHORTS } from "@/data/promoShorts";
import type { PromoShort } from "@/types/promoShort";
import type { PromoFeedItem } from "@/types/work";

function toPromoShort(item: PromoFeedItem): PromoShort {
  return {
    id: item.id,
    videoUrl: item.videoUrl,
    aspectRatio: item.aspectRatio,
    frameCrop: item.frameCrop,
    title: item.title,
    director: item.director,
    description: item.description,
    likeCount: item.likeCount,
    viewCount: item.viewCount,
    ownerUid: item.ownerUid,
    workId: item.workId,
    streamUid: item.streamUid,
    thumbnailUrl: item.thumbnailUrl,
    likedByMe: item.likedByMe,
  };
}

type Options = {
  fallbackToDemo?: boolean;
  initialItems?: PromoFeedItem[];
};

export function usePromoFeed(fallbackToDemoOrOptions: boolean | Options = true) {
  const options =
    typeof fallbackToDemoOrOptions === "boolean"
      ? { fallbackToDemo: fallbackToDemoOrOptions }
      : fallbackToDemoOrOptions;
  const { fallbackToDemo = true, initialItems } = options;

  const { user } = useAuth();
  const cacheKey = `promo:${user?.uid ?? "anon"}`;
  const cached = getCached<PromoShort[]>(cacheKey);

  const [items, setItems] = useState<PromoShort[]>(() => {
    if (cached !== undefined) return cached;
    if (initialItems !== undefined) return initialItems.map(toPromoShort);
    return fallbackToDemo ? HOME_PROMO_SHORTS : [];
  });
  const [loading, setLoading] = useState(
    () => cached === undefined && initialItems === undefined
  );
  const [fromApi, setFromApi] = useState(
    () => cached !== undefined || (initialItems !== undefined && initialItems.length > 0)
  );

  useEffect(() => {
    if (cached !== undefined) return;

    let cancelled = false;
    (async () => {
      try {
        const headers: HeadersInit = {};
        if (user) {
          const token = await user.getIdToken();
          headers.Authorization = `Bearer ${token}`;
        }
        const res = await fetch("/api/feed/promo-shorts", { headers });
        const data = (await res.json()) as { items?: PromoFeedItem[] };
        if (cancelled) return;
        const apiItems = (data.items ?? []).map(toPromoShort);
        if (apiItems.length > 0) {
          setItems(apiItems);
          setFromApi(true);
          setCache(cacheKey, apiItems);
        } else if (!fallbackToDemo) {
          setItems([]);
        }
      } catch {
        if (!fallbackToDemo && !cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fallbackToDemo, user, cacheKey, cached]);

  return { items, loading, fromApi };
}
