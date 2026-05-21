"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/context/LocaleContext";
import { formatApiError, formatClientError, readResponseJson } from "@/lib/clientErrors";
import type { WorkListItem } from "@/types/work";

export function useMyWorks() {
  const { user } = useAuth();
  const { t } = useTranslations();
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
      const { data, raw } = await readResponseJson<{ works?: WorkListItem[]; message?: string; error?: string }>(
        res
      );
      if (!res.ok) {
        setError(formatApiError(t, res.status, { ...data, message: data.message ?? raw.slice(0, 500) }));
        setWorks([]);
        return;
      }
      setWorks(data.works ?? []);
    } catch (e) {
      setError(formatClientError(t, e, { titleKey: "myWorks.errorGeneric" }));
    } finally {
      setLoading(false);
    }
  }, [user, t]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { works, loading, error, refresh };
}
