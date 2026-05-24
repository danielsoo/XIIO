"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import AppPageShell from "@/components/layout/AppPageShell";
import SubpageHeader from "@/components/layout/SubpageHeader";
import ReportContentModal from "@/components/report/ReportContentModal";
import PlaybackVideo from "@/components/PlaybackVideo";
import { useAuth } from "@/context/AuthContext";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { useRecordEngagementView } from "@/hooks/useRecordEngagementView";
import { useTranslations } from "@/context/LocaleContext";
import { formatApiError, formatClientError, readResponseJson } from "@/lib/clientErrors";
import { aspectRatioMessageKey, aspectRatioNumeric } from "@/lib/works/aspect-ratio";
import { sectionCatalogHref } from "@/lib/works/catalog-ui";
import type { PublicWorkWatch } from "@/types/watch";
import type { VideoAspectRatio } from "@/types/work";

type Props = { ownerUid: string; workId: string };

const SECTION_TITLE_KEYS: Record<PublicWorkWatch["section"], string> = {
  movies: "nav.movies",
  series: "nav.series",
  entertainment: "nav.entertainment",
  shorts: "nav.shorts",
  "school-battle": "nav.schoolBattle",
};

export default function WatchPageContent({ ownerUid, workId }: Props) {
  const { user } = useAuth();
  const { isAdmin, checked: adminChecked } = useAdminAccess();
  const { t } = useTranslations();
  const [data, setData] = useState<PublicWorkWatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/watch/${ownerUid}/${workId}`);
      const { data: body, raw } = await readResponseJson<PublicWorkWatch & { message?: string; error?: string }>(
        res
      );
      if (!res.ok) {
        setErr(
          formatApiError(t, res.status, {
            ...body,
            message: body.message ?? (raw.slice(0, 500) || t("watch.notFound")),
          })
        );
        setData(null);
        return;
      }
      setData(body);
    } catch (e) {
      setErr(formatClientError(t, e, { titleKey: "watch.loadError" }));
    } finally {
      setLoading(false);
    }
  }, [ownerUid, workId, t]);

  useEffect(() => {
    void load();
  }, [load]);

  useRecordEngagementView(ownerUid, workId, "full", Boolean(data) && !loading && !err);

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

  return (
    <AppPageShell>
        <SubpageHeader
          backHref={sectionCatalogHref(data.section)}
          backLabel={t(SECTION_TITLE_KEYS[data.section])}
          backFallbackHref={sectionCatalogHref(data.section)}
          showHome
        />

        <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
          <h1 className="text-2xl md:text-4xl font-bold text-white">{data.title}</h1>
          <button
            type="button"
            onClick={() => {
              if (!user) {
                window.location.href = "/login";
                return;
              }
              setReportOpen(true);
            }}
            className="shrink-0 text-sm text-white/60 hover:text-red-400 border border-white/15 rounded-lg px-3 py-1.5 transition"
          >
            {t("watch.report")}
          </button>
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-xiio-muted mb-4">
          {data.approvedCategory && <span>{data.approvedCategory}</span>}
          {tagLine && <span>{tagLine}</span>}
          <span>{t(aspectRatioMessageKey(ratioId))}</span>
          {data.director && (
            <span>
              {t("watch.director")}: {data.director}
            </span>
          )}
        </div>

        <div
          className="w-full mx-auto mb-6 rounded-xl overflow-hidden bg-black border border-white/10"
          style={{ maxWidth: numericRatio >= 1 ? "100%" : "min(420px, 100%)" }}
        >
          <div className="relative w-full" style={{ aspectRatio: numericRatio }}>
            <iframe
              src={data.embedUrl}
              title={data.title}
              allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full border-0"
            />
          </div>
        </div>

        {data.description && (
          <p className="text-white/80 text-sm md:text-base mb-6 whitespace-pre-wrap max-w-3xl">
            {data.description}
          </p>
        )}

        {adminChecked && isAdmin && data.playbackUrl && (
          <details className="mt-2 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-xiio-muted">
            <summary className="cursor-pointer hover:text-white transition font-medium text-amber-200/90">
              {t("watch.adminDirectPlayerTitle")}
            </summary>
            <p className="mt-3 mb-3 text-xs leading-relaxed text-xiio-muted">
              {t("watch.adminDirectPlayerHint")}
            </p>
            <PlaybackVideo src={data.playbackUrl} maxHeightClass="max-h-[70vh]" />
          </details>
        )}

      <ReportContentModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        targetType="full"
        targetOwnerUid={ownerUid}
        targetWorkId={workId}
      />
    </AppPageShell>
  );
}
