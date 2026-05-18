"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import PlaybackVideo from "@/components/PlaybackVideo";
import { useTranslations } from "@/context/LocaleContext";
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
  const { t } = useTranslations();
  const [data, setData] = useState<PublicWorkWatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/watch/${ownerUid}/${workId}`);
      const body = (await res.json().catch(() => ({}))) as PublicWorkWatch & { message?: string };
      if (!res.ok) {
        setErr(body.message ?? t("watch.notFound"));
        setData(null);
        return;
      }
      setData(body);
    } catch {
      setErr(t("watch.loadError"));
    } finally {
      setLoading(false);
    }
  }, [ownerUid, workId, t]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <main className="min-h-screen bg-xiio-bg pt-24 px-6 flex items-center justify-center">
        <p className="text-xiio-muted">{t("common.loading")}</p>
      </main>
    );
  }

  if (err || !data) {
    return (
      <main className="min-h-screen bg-xiio-bg pt-24 px-6 md:px-12 pb-16">
        <p className="text-red-400 mb-4">{err ?? t("watch.notFound")}</p>
        <Link href="/" className="text-sm text-xiio-accent hover:underline">
          {t("common.home")}
        </Link>
      </main>
    );
  }

  const ratioId: VideoAspectRatio = data.approvedAspectRatio ?? "16:9";
  const numericRatio = aspectRatioNumeric(ratioId);
  const tagLine = data.approvedTags.length > 0 ? data.approvedTags.join(" · ") : null;

  return (
    <main className="min-h-screen bg-xiio-bg pt-24 px-4 md:px-12 pb-16">
      <div className="max-w-5xl mx-auto">
        <Link
          href={sectionCatalogHref(data.section)}
          className="text-sm text-xiio-muted hover:text-xiio-accent transition mb-6 inline-block"
        >
          ← {t(SECTION_TITLE_KEYS[data.section])}
        </Link>

        <h1 className="text-2xl md:text-4xl font-bold text-white mb-2">{data.title}</h1>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-xiio-muted mb-6">
          {data.approvedCategory && <span>{data.approvedCategory}</span>}
          {tagLine && <span>{tagLine}</span>}
          <span>{t(aspectRatioMessageKey(ratioId))}</span>
          {data.director && (
            <span>
              {t("watch.director")}: {data.director}
            </span>
          )}
        </div>

        {data.description && (
          <p className="text-white/80 text-sm md:text-base mb-6 whitespace-pre-wrap max-w-3xl">
            {data.description}
          </p>
        )}

        <div
          className="w-full mx-auto mb-8 rounded-xl overflow-hidden bg-black border border-white/10"
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

        {data.playbackUrl && (
          <details className="text-sm text-xiio-muted">
            <summary className="cursor-pointer hover:text-white transition mb-2">
              {t("watch.altPlayer")}
            </summary>
            <PlaybackVideo src={data.playbackUrl} maxHeightClass="max-h-[70vh]" />
          </details>
        )}
      </div>
    </main>
  );
}
