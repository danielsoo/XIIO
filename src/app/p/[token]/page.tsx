"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AppPageShell from "@/components/layout/AppPageShell";
import PortfolioSubmissionWork from "@/components/profile/PortfolioSubmissionWork";
import PublicProfileCard from "@/components/profile/PublicProfileCard";
import { useTranslations } from "@/context/LocaleContext";
import type { PublicPortfolioPayload } from "@/types/portfolio";

export default function PublicPortfolioPage() {
  const { token } = useParams<{ token: string }>();
  const { t } = useTranslations();
  const [data, setData] = useState<PublicPortfolioPayload | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    void (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/portfolio/${encodeURIComponent(token)}`);
        if (!res.ok) {
          setErr(res.status === 410 ? t("portfolio.public.expired") : t("portfolio.public.notFound"));
          setData(null);
          return;
        }
        setData((await res.json()) as PublicPortfolioPayload);
      } catch {
        setErr(t("portfolio.public.loadError"));
      } finally {
        setLoading(false);
      }
    })();
  }, [token, t]);

  return (
    <AppPageShell>
      {loading ? (
        <p className="text-xiio-muted">{t("common.loading")}</p>
      ) : err || !data ? (
        <p className="text-red-400">{err}</p>
      ) : (
        <div className="max-w-5xl mx-auto w-full space-y-8">
          <PublicProfileCard
            profile={data.profile}
            submissionBadge={t("portfolio.public.badge")}
            shareTitle={data.shareTitle}
          />
          <div className="min-w-0 w-full">
            {data.works.length === 0 ? (
              <p className="text-xiio-muted">{t("portfolio.public.empty")}</p>
            ) : (
              <ul className="grid gap-10 lg:grid-cols-2 lg:gap-8">
                {data.works.map((w) => (
                  <PortfolioSubmissionWork key={`${w.ownerUid}_${w.workId}`} work={w} />
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </AppPageShell>
  );
}
