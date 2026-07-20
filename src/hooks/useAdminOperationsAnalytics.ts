"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import type { AdminAnalyticsRange, AdminOperationsAnalytics } from "@/types/admin-analytics";

const REFRESH_INTERVAL_MS = 15_000;

export function useAdminOperationsAnalytics(range: AdminAnalyticsRange) {
  const { user } = useAuth();
  const [data, setData] = useState<AdminOperationsAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const refresh = useCallback(
    async (background = false) => {
      if (!user) return;
      const id = ++requestId.current;
      if (background) setRefreshing(true);
      else setLoading(true);
      try {
        const token = await user.getIdToken();
        const response = await fetch(`/api/admin/analytics?range=${range}`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        const body = (await response.json().catch(() => null)) as
          | AdminOperationsAnalytics
          | { error?: string }
          | null;
        if (!response.ok) {
          throw new Error(body && "error" in body ? body.error : "Unable to load analytics.");
        }
        if (id !== requestId.current) return;
        setData(body as AdminOperationsAnalytics);
        setError(null);
      } catch (caught) {
        if (id !== requestId.current) return;
        setError(caught instanceof Error ? caught.message : "Unable to load analytics.");
      } finally {
        if (id === requestId.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [range, user]
  );

  useEffect(() => {
    void refresh(false);
    const interval = window.setInterval(() => void refresh(true), REFRESH_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [refresh]);

  return { data, loading, refreshing, error, refresh };
}

