"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import PortfolioSubmissionWork from "@/components/profile/PortfolioSubmissionWork";
import PublicProfileHeader from "@/components/profile/PublicProfileHeader";
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
    <main className="min-h-screen bg-xiio-bg text-white">
      <div className="max-w-5xl mx-auto px-4 py-10">
        {loading ? (
          <p className="text-xiio-muted">{t("common.loading")}</p>
        ) : err || !data ? (
          <p className="text-red-400">{err}</p>
        ) : (
          <>
            <PublicProfileHeader
              handle={data.profile.handle}
              displayName={data.profile.displayName}
              headline={data.profile.headline}
              bio={data.profile.bio}
              openToCollaborate={data.profile.openToCollaborate}
              collaborationNote={data.profile.collaborationNote}
              followerCount={data.profile.followerCount}
              followingCount={data.profile.followingCount}
              submissionBadge={t("portfolio.public.badge")}
              shareTitle={data.shareTitle}
            />

            {data.works.length === 0 ? (
              <p className="text-xiio-muted">{t("portfolio.public.empty")}</p>
            ) : (
              <ul className="space-y-12">
                {data.works.map((w) => (
                  <PortfolioSubmissionWork
                    key={`${w.ownerUid}_${w.workId}`}
                    work={w}
                  />
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </main>
  );
}
