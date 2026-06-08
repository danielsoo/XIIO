"use client";

import { useCallback, useEffect, useState } from "react";
import SocietyProfileBody from "@/components/society/SocietyProfileBody";
import type { PeopleProfilePayload } from "@/components/profile/PeopleProfileView";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/context/LocaleContext";

export default function SocietySelfProfileSection() {
  const { user } = useAuth();
  const { t } = useTranslations();
  const [data, setData] = useState<PeopleProfilePayload | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user) {
      setData(null);
      return;
    }
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const headers = { Authorization: `Bearer ${token}` };
      const proRes = await fetch("/api/me/professional-profile", { headers });
      if (!proRes.ok) {
        setData(null);
        return;
      }
      const pro = (await proRes.json()) as { handle?: string | null };
      const handle = pro.handle?.trim();
      if (!handle) {
        setData(null);
        return;
      }
      const res = await fetch(`/api/people/${encodeURIComponent(handle)}`, { headers });
      if (!res.ok) {
        setData(null);
        return;
      }
      setData((await res.json()) as PeopleProfilePayload);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!user) return null;
  if (loading && !data) {
    return <p className="mb-8 px-4 text-sm text-white/40 lg:px-0">{t("common.loading")}</p>;
  }
  if (!data?.profile.handle) return null;

  const works = [...data.directed, ...data.credited];

  return <SocietyProfileBody handle={data.profile.handle} works={works} isSelf />;
}
