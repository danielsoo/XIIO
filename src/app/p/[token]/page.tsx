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
  const [copied, setCopied] = useState(false);

  const copyShareLink = () => {
    void navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

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
        <div className="max-w-[1100px] mx-auto w-full space-y-8">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={copyShareLink}
              className="rounded-full border border-white/15 px-5 py-2.5 text-[13px] text-white hover:bg-white/[0.06] transition"
            >
              {copied ? t("portfolio.public.linkCopied") : t("portfolio.public.copyShareLink")}
            </button>
          </div>
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
