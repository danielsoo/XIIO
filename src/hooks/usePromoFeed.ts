"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { HOME_PROMO_SHORTS } from "@/data/promoShorts";
import type { PromoShort } from "@/types/promoShort";
import type { PromoFeedItem } from "@/types/work";

function toPromoShort(item: PromoFeedItem): PromoShort {
  return {
    id: item.id,
    videoUrl: item.videoUrl,
    aspectRatio: item.aspectRatio,
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

export function usePromoFeed(fallbackToDemo = true) {
  const { user } = useAuth();
  const [items, setItems] = useState<PromoShort[]>(fallbackToDemo ? HOME_PROMO_SHORTS : []);
  const [loading, setLoading] = useState(true);
  const [fromApi, setFromApi] = useState(false);

  useEffect(() => {
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
  }, [fallbackToDemo, user]);

  return { items, loading, fromApi };
}
