"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

export type AdminWorkStats = {
  pendingFull: number;
  pendingPromo: number;
  removalRequested: number;
};

export function useAdminWorkStats(enabled: boolean) {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminWorkStats | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled || !user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/admin/works/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = (await res.json()) as AdminWorkStats;
      setStats(data);
    } catch {
      /* ignore */
    }
  }, [enabled, user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const pendingTotal =
    stats == null ? 0 : stats.pendingFull + stats.pendingPromo + stats.removalRequested;

  return { stats, pendingTotal, refresh };
}
