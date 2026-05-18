"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import type { WorkListItem } from "@/types/work";

export function useMyWorks() {
  const { user } = useAuth();
  const [works, setWorks] = useState<WorkListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) {
      setWorks([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/me/works", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await res.json().catch(() => ({}))) as { works?: WorkListItem[]; message?: string };
      if (!res.ok) {
        setError(data.message ?? `HTTP ${res.status}`);
        setWorks([]);
        return;
      }
      setWorks(data.works ?? []);
    } catch {
      setError("fetch_failed");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { works, loading, error, refresh };
}
