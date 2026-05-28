"use client";

import { useMemo, useState } from "react";
import ContentCard from "@/components/ContentCard";
import PlaybackVideo from "@/components/PlaybackVideo";
import PromoShortPlayer from "@/components/shorts/PromoShortPlayer";
import { HOME_HERO_PEEK_SIDE_FRAME_CLASS, HOME_HERO_PEEK_VIEWPORT_CLASS } from "@/components/shorts/PromoShortPlayer";
import { useTranslations } from "@/context/LocaleContext";
import { gradientForTitle } from "@/lib/works/catalog-ui";
import { buildEditorPreviewPromoShort } from "@/lib/works/editor-preview-promo";
import { promoCropToVideoStyle } from "@/lib/works/promo-crop-interaction";
import type { PromoShort } from "@/types/promoShort";
import type { PromoFrameCrop } from "@/types/work";

type Props = {
  workTitle: string;
  catalogThumbnailUrl?: string | null;
  liveThumbnailUrl?: string | null;
  title: string;
  description: string;
  director: string;
  frameCrop: PromoFrameCrop;
  promoPlaybackUrl?: string | null;
  fullPlaybackUrl?: string | null;
  ownerUid?: string;
  workId?: string;
};

function CroppedCoverImage({
  src,
  alt,
  frameCrop,
  className = "",
}: {
  src: string;
  alt: string;
  frameCrop: PromoFrameCrop;
  className?: string;
}) {
  const style = promoCropToVideoStyle(frameCrop);
  return (
    <img
      src={src}
      alt={alt}
      className={`absolute inset-0 h-full w-full object-cover ${className}`}
      style={style}
      loading="eager"
      decoding="async"
    />
  );
}

function PortraitThumbFrame({
  src,
  frameCrop,
  className = "",
}: {
  src?: string | null;
  frameCrop: PromoFrameCrop;
  className?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-[14px] border border-white/10 bg-gradient-to-br from-gray-900 via-[#1a0533]/90 to-gray-900 ${className}`}
    >
      {src ? (
        <CroppedCoverImage src={src} alt="" frameCrop={frameCrop} />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-xiio-muted px-2 text-center">
          —
        </div>
      )}
    </div>
  );
}

function CatalogPlaceholderCard() {
  return (
    <div
      className="relative rounded-2xl overflow-hidden aspect-video bg-white/[0.06] border border-white/10"
      aria-hidden
    />
  );
}

export default function SubmissionSurfacePreviews({
  workTitle,
  catalogThumbnailUrl,
  liveThumbnailUrl,
  title,
  description,
  director,
  frameCrop,
  promoPlaybackUrl,
  fullPlaybackUrl,
  ownerUid,
  workId,
}: Props) {
  const { t } = useTranslations();
  const [fullPlaybackOpen, setFullPlaybackOpen] = useState(false);

  const displayThumbnail = liveThumbnailUrl ?? catalogThumbnailUrl ?? null;

  const previewPromo: PromoShort = useMemo(
    () =>
      buildEditorPreviewPromoShort({
        title,
        description,
        thumbnailUrl: displayThumbnail,
        frameCrop,
        videoUrl: promoPlaybackUrl ?? "",
        director,
        ownerUid,
        workId,
      }),
    [title, description, displayThumbnail, frameCrop, promoPlaybackUrl, director, ownerUid, workId]
  );

  const catalogGradient = gradientForTitle(workTitle || title);
  const canPlayShorts = Boolean(promoPlaybackUrl?.trim());

  return (
    <section className="rounded-2xl border border-white/10 bg-xiio-surface p-5 md:p-6 mb-6 space-y-6">
      <div>
        <h2 className="text-white font-semibold text-base">{t("promoEditor.livePreviewTitle")}</h2>
        <p className="text-sm text-xiio-muted mt-1 leading-relaxed">{t("promoEditor.livePreviewHint")}</p>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-white/90">{t("promoEditor.previewCatalogTitle")}</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <ContentCard
            title={workTitle || title}
            thumbnailUrl={displayThumbnail ?? undefined}
            gradient={catalogGradient}
          />
          <CatalogPlaceholderCard />
          <CatalogPlaceholderCard />
          <div className="hidden md:block">
            <CatalogPlaceholderCard />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-white/90">{t("promoEditor.previewHeroTitle")}</p>
        <div className={HOME_HERO_PEEK_VIEWPORT_CLASS}>
          <div className={`relative ${HOME_HERO_PEEK_SIDE_FRAME_CLASS} scale-90 opacity-80`}>
            <PortraitThumbFrame src={displayThumbnail} frameCrop={frameCrop} className="h-full w-full" />
            <div className="absolute inset-0 bg-black/55 pointer-events-none rounded-[14px]" aria-hidden />
          </div>
          <div className={HOME_HERO_PEEK_SIDE_FRAME_CLASS}>
            <PortraitThumbFrame src={displayThumbnail} frameCrop={frameCrop} className="h-full w-full" />
          </div>
          <div className={`relative ${HOME_HERO_PEEK_SIDE_FRAME_CLASS} scale-90 opacity-80`}>
            <PortraitThumbFrame src={displayThumbnail} frameCrop={frameCrop} className="h-full w-full" />
            <div className="absolute inset-0 bg-black/55 pointer-events-none rounded-[14px]" aria-hidden />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-white/90">{t("promoEditor.previewShortsTitle")}</p>
        <div className="mx-auto w-full max-w-sm">
          {canPlayShorts ? (
            <PromoShortPlayer
              item={previewPromo}
              isActive
              layout="stacked"
              compact
              playbackEnabled
              videoPreload="metadata"
              showChrome
              expandedEmbed
            />
          ) : (
            <PortraitThumbFrame
              src={displayThumbnail}
              frameCrop={frameCrop}
              className="w-full aspect-[9/16] max-h-[min(52vh,520px)] mx-auto"
            />
          )}
        </div>
      </div>

      {fullPlaybackUrl ? (
        <div className="border-t border-white/10 pt-4">
          <button
            type="button"
            onClick={() => setFullPlaybackOpen((o) => !o)}
            className="text-sm text-xiio-accent hover:underline font-medium"
          >
            {fullPlaybackOpen
              ? t("promoEditor.hideFullPlayback")
              : t("promoEditor.showFullPlayback")}
          </button>
          {fullPlaybackOpen ? (
            <div className="mt-3">
              <p className="text-xs text-xiio-muted mb-2">{t("promoEditor.fullVideoLabel")}</p>
              <PlaybackVideo src={fullPlaybackUrl} maxHeightClass="max-h-[min(36vh,360px)]" />
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
