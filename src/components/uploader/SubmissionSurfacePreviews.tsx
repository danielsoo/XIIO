"use client";

import { useMemo, useState } from "react";
import ContentCard from "@/components/ContentCard";
import PlaybackVideo from "@/components/PlaybackVideo";
import PromoShortCarousel from "@/components/shorts/PromoShortCarousel";
import PromoShortPlayer from "@/components/shorts/PromoShortPlayer";
import { HOME_HERO_PEEK_VIEWPORT_CLASS } from "@/components/shorts/PromoShortPlayer";
import { useTranslations } from "@/context/LocaleContext";
import { gradientForTitle } from "@/lib/works/catalog-ui";
import { buildEditorPreviewPromoShort } from "@/lib/works/editor-preview-promo";
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

function CatalogPlaceholderCard() {
  return (
    <div
      className="relative rounded-2xl overflow-hidden aspect-video bg-white/[0.06] border border-white/10"
      aria-hidden
    />
  );
}

function ShortsEncodingPlaceholder({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.03] min-h-[200px] flex items-center justify-center p-6 text-center">
      <p className="text-sm text-xiio-muted leading-relaxed">{message}</p>
    </div>
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
  const [carouselIndex, setCarouselIndex] = useState(0);

  const catalogThumbnailSrc = liveThumbnailUrl ?? catalogThumbnailUrl ?? null;
  const canPlayShorts = Boolean(promoPlaybackUrl?.trim());

  const previewPromo: PromoShort = useMemo(
    () =>
      buildEditorPreviewPromoShort({
        title,
        description,
        thumbnailUrl: null,
        frameCrop,
        videoUrl: promoPlaybackUrl ?? "",
        director,
        ownerUid,
        workId,
      }),
    [title, description, frameCrop, promoPlaybackUrl, director, ownerUid, workId]
  );

  const carouselItems = useMemo(() => (canPlayShorts ? [previewPromo] : []), [canPlayShorts, previewPromo]);

  const catalogGradient = gradientForTitle(workTitle || title);
  const shortsEncodingMessage = t("promoEditor.previewShortsEncoding");

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
            thumbnailUrl={catalogThumbnailSrc ?? undefined}
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
        {canPlayShorts ? (
          <PromoShortCarousel
            items={carouselItems}
            index={carouselIndex}
            onIndexChange={setCarouselIndex}
            playerSize="homeHeroSmall"
            compact
            viewportClassName={HOME_HERO_PEEK_VIEWPORT_CLASS}
          />
        ) : (
          <ShortsEncodingPlaceholder message={shortsEncodingMessage} />
        )}
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
            <ShortsEncodingPlaceholder message={shortsEncodingMessage} />
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
