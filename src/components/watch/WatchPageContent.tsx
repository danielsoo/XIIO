"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import filmHeroImage from "../../../film_hero.png";
import AppPageShell from "@/components/layout/AppPageShell";
import SubpageHeader from "@/components/layout/SubpageHeader";
import ReportContentModal from "@/components/report/ReportContentModal";
import WatchlistButton from "@/components/watchlist/WatchlistButton";
import GuestLimitedPlayer from "@/components/watch/GuestLimitedPlayer";
import SeriesEpisodeSection from "@/components/watch/SeriesEpisodeSection";
import StreamProgressIframe from "@/components/watch/StreamProgressIframe";
import StreamHlsVideo from "@/components/shorts/StreamHlsVideo";
import WatchDetailTabs from "@/components/watch/WatchDetailTabs";
import WatchMoreSections from "@/components/watch/WatchMoreSections";
import PlaybackVideo from "@/components/PlaybackVideo";
import { useAuth } from "@/context/AuthContext";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { useRecordEngagementView } from "@/hooks/useRecordEngagementView";
import { useTranslations } from "@/context/LocaleContext";
import { releaseDateFor } from "@/data/watchExtras";
import { formatApiError, formatClientError } from "@/lib/clientErrors";
import { requestPublicWatch } from "@/lib/watchDataCache";
import { aspectRatioMessageKey, aspectRatioNumeric } from "@/lib/works/aspect-ratio";
import { formatDurationMinutes, sectionCatalogHref } from "@/lib/works/catalog-ui";
import type { PublicWorkWatch } from "@/types/watch";
import type { VideoAspectRatio } from "@/types/work";

type Props = { ownerUid: string; workId: string };

type WatchPhase = "prologue" | "main";

export default function WatchPageContent({ ownerUid, workId }: Props) {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, checked: adminChecked } = useAdminAccess();
  const { t } = useTranslations();
  const [data, setData] = useState<PublicWorkWatch | null>(null);
  const [phase, setPhase] = useState<WatchPhase>("main");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [playerOpen, setPlayerOpen] = useState(false);
  const playerRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const result = await requestPublicWatch(ownerUid, workId);
      const body = result.data;
      if (!result.ok) {
        setErr(
          formatApiError(t, result.status, {
            ...body,
            message: body.message ?? (result.raw.slice(0, 500) || t("watch.notFound")),
          })
        );
        setData(null);
        return;
      }
      setData(body);
      setPhase(body.prologue?.playbackUrl ? "prologue" : "main");
      setPlayerOpen(false);
    } catch (e) {
      setErr(formatClientError(t, e, { titleKey: "watch.loadError" }));
    } finally {
      setLoading(false);
    }
  }, [ownerUid, workId, t]);

  useEffect(() => {
    void load();
  }, [load]);

  useRecordEngagementView(
    ownerUid,
    workId,
    "full",
    Boolean(data) && !loading && !err && playerOpen && phase === "main"
  );

  if (loading) {
    return (
      <main className="min-h-screen bg-xiio-bg pt-24 px-6 flex items-center justify-center">
        <p className="text-xiio-muted">{t("common.loading")}</p>
      </main>
    );
  }

  if (err || !data) {
    return (
      <AppPageShell>
        <SubpageHeader title={t("watch.notFound")} backFallbackHref="/" />
        <p className="text-red-400 whitespace-pre-wrap break-words">{err ?? t("watch.notFound")}</p>
      </AppPageShell>
    );
  }

  const ratioId: VideoAspectRatio = data.approvedAspectRatio ?? "16:9";
  const numericRatio = aspectRatioNumeric(ratioId);
  const tagLine = data.approvedTags.length > 0 ? data.approvedTags.join(" · ") : null;
  const releaseYear = releaseDateFor(workId).match(/\b\d{4}\b/)?.[0];
  const metadata = [
    data.durationSec ? formatDurationMinutes(data.durationSec) : null,
    releaseYear,
    data.approvedCategory,
  ].filter(Boolean) as string[];
  const heroImage = data.thumbnailUrl || filmHeroImage.src;
  const isGuest = !authLoading && !user;
  const showingPrologue = phase === "prologue" && Boolean(data.prologue?.playbackUrl);
  const activePlayback = showingPrologue ? data.prologue! : data;
  const useGuestPlayer = isGuest && Boolean(activePlayback.playbackUrl);
  const playLabel = data.section === "series" ? t("watch.watchSeries") : t("watch.playFilm");

  const openPlayer = () => {
    setPlayerOpen(true);
    window.setTimeout(() => {
      playerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 40);
  };

  return (
    <main className="min-h-screen bg-[#08090b] pb-20">
      <section className="relative min-h-[clamp(560px,68vh,700px)] overflow-hidden border-b border-white/[0.06]">
        <div
          className="absolute inset-0 bg-cover bg-center scale-[1.01]"
          style={{ backgroundImage: `url(${JSON.stringify(heroImage)})` }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-black/5" aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#08090b] via-transparent to-black/20" aria-hidden="true" />

        <Link
          href={sectionCatalogHref(data.section)}
          className="absolute left-5 top-7 z-10 inline-flex items-center gap-2 text-[14px] text-white/75 hover:text-white transition lg:left-12"
        >
          <span aria-hidden="true">‹</span>
          {t("watch.back")}
        </Link>

        <div className="relative z-[1] flex min-h-[clamp(560px,68vh,700px)] items-center px-5 pb-14 pt-24 lg:px-12">
          <div className="max-w-[620px]">
            {tagLine ? (
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">{tagLine}</p>
            ) : null}
            <h1 className="font-serif text-[54px] leading-[0.96] tracking-[-0.025em] text-white sm:text-[70px] lg:text-[82px]">
              {data.title}
            </h1>
            {metadata.length > 0 ? (
              <p className="mt-6 flex flex-wrap gap-x-2.5 text-[14px] text-white/65">
                {metadata.map((item, index) => (
                  <span key={`${item}-${index}`}>
                    {index > 0 ? <span className="mr-2.5 text-white/35">·</span> : null}
                    {item}
                  </span>
                ))}
              </p>
            ) : null}
            {data.description ? (
              <p className="mt-6 max-w-[590px] whitespace-pre-wrap text-[16px] leading-7 text-white/76 sm:text-[17px]">
                {data.description}
              </p>
            ) : null}
            {data.director ? (
              <p className="mt-3 text-[13px] text-white/48">
                {t("watch.director")} · {data.director}
              </p>
            ) : null}

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={openPlayer}
                className="inline-flex h-12 min-w-[164px] items-center justify-center gap-2 rounded-full bg-white px-7 text-[14px] font-semibold text-black transition hover:bg-white/88"
              >
                <span aria-hidden="true">▶</span>
                {playLabel}
              </button>
              <WatchlistButton ownerUid={ownerUid} workId={workId} variant="hero" />
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-[1480px] px-5 pt-7 lg:px-12">
        {playerOpen ? (
          <div ref={playerRef} className="mb-12 scroll-mt-20">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                {showingPrologue ? (
                  <p className="mb-1 text-xs font-medium text-xiio-accent">{t("watch.prologuePlaying")}</p>
                ) : null}
                <h2 className="text-xl font-semibold text-white">
                  {showingPrologue ? data.prologue?.title ?? data.title : data.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setPlayerOpen(false)}
                className="rounded-full border border-white/15 px-4 py-2 text-xs text-white/60 transition hover:border-white/30 hover:text-white"
              >
                {t("watch.closePlayer")}
              </button>
            </div>
            <div
              className="relative mx-auto w-full overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl shadow-black/50"
              style={{ maxWidth: numericRatio >= 1 ? "100%" : "min(520px, 100%)" }}
            >
              <div className="relative w-full" style={{ aspectRatio: numericRatio }}>
                {useGuestPlayer ? (
                  <GuestLimitedPlayer
                    key={showingPrologue ? "prologue" : "main"}
                    src={activePlayback.playbackUrl!}
                    durationSec={activePlayback.durationSec}
                  />
                ) : showingPrologue ? (
                  <StreamHlsVideo
                    key="prologue-hls"
                    src={data.prologue!.playbackUrl!}
                    ariaLabel={data.prologue?.title ?? data.title}
                    className="absolute inset-0 h-full w-full object-contain bg-black"
                    playsInline
                    muted={false}
                    preload="auto"
                    controls
                    preferHighStart
                    showQualitySelector
                  />
                ) : (
                  <StreamProgressIframe
                    key="main-hls"
                    src={data.playbackUrl!}
                    title={data.title}
                    ownerUid={ownerUid}
                    workId={workId}
                    className="absolute inset-0 h-full w-full border-0"
                  />
                )}
              </div>
              {showingPrologue ? (
                <button
                  type="button"
                  onClick={() => setPhase("main")}
                  className="absolute bottom-3 right-3 z-10 rounded-lg border border-white/20 bg-black/70 px-3 py-1.5 text-sm text-white transition hover:bg-black/90"
                >
                  {t("watch.skipPrologue")}
                </button>
              ) : null}
            </div>
            {showingPrologue && data.prologue?.description ? (
              <p className="mt-4 max-w-3xl whitespace-pre-wrap text-sm text-white/65">
                {data.prologue.description}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="relative z-10 flex h-0 justify-end">
          <button
            type="button"
            onClick={() => {
              if (!user) {
                window.location.href = "/login";
                return;
              }
              setReportOpen(true);
            }}
            className="text-xs text-white/35 transition hover:text-red-400"
          >
            {t("watch.report")}
          </button>
        </div>

        {data.section !== "series" ? (
          <WatchDetailTabs
            ownerUid={ownerUid}
            workId={workId}
            section={data.section}
            title={data.title}
            description={data.description}
            durationSec={data.durationSec}
            approvedCategory={data.approvedCategory}
            approvedAspectRatio={data.approvedAspectRatio}
            approvedSchoolId={data.approvedSchoolId}
            approvedSchoolName={data.approvedSchoolName}
            credits={data.credits}
          />
        ) : (
          <SeriesEpisodeSection
            focusItem={{
              id: `${ownerUid}_${workId}`,
              ownerUid,
              workId,
              title: data.title,
              director: data.director,
              section: data.section,
              approvedCategory: data.approvedCategory,
              approvedTags: data.approvedTags,
              thumbnailUrl: data.thumbnailUrl,
            }}
            approvedAspectRatio={data.approvedAspectRatio}
            approvedSchoolId={data.approvedSchoolId}
            approvedSchoolName={data.approvedSchoolName}
            credits={data.credits}
          />
        )}

        {data.section === "series" ? (
          <WatchMoreSections section={data.section} ownerUid={ownerUid} workId={workId} />
        ) : null}

        {adminChecked && isAdmin && data.playbackUrl ? (
          <details className="mt-14 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-xiio-muted">
            <summary className="cursor-pointer font-medium text-amber-200/90 transition hover:text-white">
              {t("watch.adminDirectPlayerTitle")}
            </summary>
            <p className="mb-3 mt-3 text-xs leading-relaxed text-xiio-muted">
              {t("watch.adminDirectPlayerHint")}
            </p>
            <PlaybackVideo src={data.playbackUrl} maxHeightClass="max-h-[70vh]" />
          </details>
        ) : null}
      </div>

      <ReportContentModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        targetType="full"
        targetOwnerUid={ownerUid}
        targetWorkId={workId}
      />
    </main>
  );
}
