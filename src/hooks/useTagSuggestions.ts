"use client";

import { useEffect, useState } from "react";
import type { User } from "firebase/auth";

export function useTagSuggestions(user: User | null, query: string, enabled: boolean) {
  const [items, setItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || !user) {
      setItems([]);
      return;
    }

    const needle = query.trim().replace(/^#+/, "");
    if (needle.length < 1) {
      setItems([]);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => {
      void (async () => {
        setLoading(true);
        try {
          const token = await user.getIdToken();
          const params = new URLSearchParams({ q: needle });
          const res = await fetch(`/api/tags/suggest?${params}`, {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal,
          });
          const data = (await res.json()) as { items?: string[] };
          if (!controller.signal.aborted) {
            setItems(Array.isArray(data.items) ? data.items : []);
          }
        } catch {
          if (!controller.signal.aborted) setItems([]);
        } finally {
          if (!controller.signal.aborted) setLoading(false);
        }
      })();
    }, 200);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [user, query, enabled]);

  return { items, loading };
}
