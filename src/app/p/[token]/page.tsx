"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import PlaybackVideo from "@/components/PlaybackVideo";
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
              <ul className="space-y-10">
                {data.works.map((w) => (
                  <li key={`${w.ownerUid}_${w.workId}`} className="rounded-2xl border border-white/10 bg-xiio-surface p-5">
                    <h2 className="text-lg font-semibold">{w.title}</h2>
                    <p className="text-xs text-xiio-muted mt-1">
                      {t(`network.credits.role.${w.role}`)}
                      {w.characterName ? ` · ${w.characterName}` : ""}
                      {w.director ? ` · ${w.director}` : ""}
                    </p>
                    {w.description && (
                      <p className="text-sm text-white/80 mt-2 whitespace-pre-wrap">{w.description}</p>
                    )}
                    {w.playbackUrl ? (
                      <div className="mt-4 max-w-3xl">
                        <PlaybackVideo src={w.playbackUrl} maxHeightClass="max-h-[60vh]" />
                      </div>
                    ) : (
                      <p className="text-sm text-amber-300/90 mt-4">{t("portfolio.public.noPlayback")}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </main>
  );
}
