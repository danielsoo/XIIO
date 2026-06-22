"use client";

import Link from "next/link";
import { useCallback, useMemo } from "react";
import AdminHomeColorPicker from "@/components/home/AdminHomeColorPicker";
import HomeContentRow from "@/components/home/HomeContentRow";
import HomeFeaturedStoryPanel from "@/components/home/HomeFeaturedStoryPanel";
import HomeSurfaceCampusRow from "@/components/home/HomeSurfaceCampusRow";
import HeroLandscapeBackdrop from "@/components/hero/HeroLandscapeBackdrop";
import { IconPlay } from "@/components/icons/MockupIcons";
import { useAuth } from "@/context/AuthContext";
import { useHeroWaveLayout } from "@/context/HeroWaveLayoutContext";
import { useHomeHeroTheme } from "@/context/HomeHeroThemeContext";
import { useTranslations } from "@/context/LocaleContext";
import { useCatalogFeed } from "@/hooks/useCatalogFeed";
import { usePromoFeed } from "@/hooks/usePromoFeed";
import {
  catalogItemsToHomeStories,
  promoToHomeStory,
} from "@/lib/categoryCatalogAdapter";
import { DEFAULT_FEATURED_STORY } from "@/lib/homeMockData";
import { watchHref } from "@/lib/works/catalog-ui";
import { MOCKUP_HOME } from "@/lib/mockupHomeSpec";
import { MOCKUP_MEASURES } from "@/lib/mockupLayout";
import {
  heroSectionMinHeight,
  heroTextBandMarginTop,
  heroTextBandMinHeight,
} from "@/lib/homeHeroLayout";
import type { CatalogFeedItem, PromoFeedItem } from "@/types/work";

type Props = {
  initialPromoItems?: PromoFeedItem[];
  initialMovies?: CatalogFeedItem[];
  initialSeries?: CatalogFeedItem[];
};

export default function HomeMockPage({
  initialPromoItems,
  initialMovies,
  initialSeries,
}: Props) {
  const { t } = useTranslations();
  const { user } = useAuth();
  const { rgbTuple, overlayEnabled, heroStyle, themeReady } = useHomeHeroTheme();
  const {
    waveRect,
    gradStartPercent,
    layoutReady,
    isLgViewport,
    registerHeroSection,
    registerHeroText,
  } = useHeroWaveLayout();
  const { items: promoItems } = usePromoFeed({
    fallbackToDemo: false,
    initialItems: initialPromoItems,
  });
  const { items: movies } = useCatalogFeed("movies", 8, initialMovies);
  const { items: series } = useCatalogFeed("series", 4, initialSeries);

  const featuredStories = useMemo(
    () =>
      promoItems
        .slice(0, MOCKUP_MEASURES.featuredRowItemCount)
        .map(promoToHomeStory),
    [promoItems]
  );
  const surfaceStories = useMemo(() => catalogItemsToHomeStories(movies), [movies]);
  const selectsStories = useMemo(() => catalogItemsToHomeStories(series), [series]);

  const setHeroSectionRef = useCallback(
    (el: HTMLElement | null) => {
      registerHeroSection(el);
    },
    [registerHeroSection]
  );

  const setHeroTextRef = useCallback(
    (el: HTMLDivElement | null) => {
      registerHeroText(el);
    },
    [registerHeroText]
  );

  const visualReady = themeReady && layoutReady;

  const featuredPromo = promoItems[0];
  const featuredTitle = featuredPromo?.title ?? DEFAULT_FEATURED_STORY.title;
  const featuredMeta = featuredPromo
    ? `Promo • ${featuredPromo.director}`
    : `${DEFAULT_FEATURED_STORY.category} • ${DEFAULT_FEATURED_STORY.duration}`;

  const watchHrefPrimary =
    user && featuredPromo?.ownerUid && featuredPromo?.workId
      ? watchHref(featuredPromo.ownerUid, featuredPromo.workId)
      : user
        ? "/movies"
        : "/login";

  const heroGridBandStyle = isLgViewport
    ? {
        marginTop: heroTextBandMarginTop(),
        minHeight: heroTextBandMinHeight(waveRect),
      }
    : undefined;

  return (
    <main className={`min-h-screen min-w-0 w-full ${MOCKUP_HOME.pageShell}`} style={heroStyle}>
      <section
        ref={setHeroSectionRef}
        className={`relative isolate flex min-w-0 w-full flex-col -mt-[60px] pt-[60px] ${MOCKUP_HOME.heroSection}`}
        style={{ minHeight: heroSectionMinHeight(waveRect) }}
      >
        <HeroLandscapeBackdrop
          rgbTuple={rgbTuple}
          overlayEnabled={overlayEnabled}
          backgroundScope="home"
          variant="home"
          gradStartPercent={gradStartPercent}
          visualReady={visualReady}
          priority
          presetOverride="home_under_water"
        />

        <div
          className={`relative z-10 flex flex-1 flex-col ${MOCKUP_HOME.heroInnerMinHeight} ${MOCKUP_HOME.heroContentTop}`}
          style={{ minHeight: waveRect.height }}
        >
          <div
            className={`flex-1 w-full ${MOCKUP_HOME.heroGrid}`}
            style={heroGridBandStyle}
          >
            <div
              ref={setHeroTextRef}
              className={`${MOCKUP_HOME.heroTextColumnWide} ${MOCKUP_HOME.heroTextColumn} ${MOCKUP_HOME.heroTextBottom}`}
            >
              <h1 className={MOCKUP_HOME.heroTitle}>
                <span className="block text-white">{t("home.mock.heroLine1")}</span>
                <span className="block text-white lg:whitespace-nowrap">
                  <em
                    className="italic mr-[0.35em]"
                    style={{ color: MOCKUP_HOME.accentBlue }}
                  >
                    {t("home.mock.heroAccent")}
                  </em>
                  {t("home.mock.heroLine2")}
                </span>
              </h1>
              <p className={MOCKUP_HOME.heroSubtitle}>
                <span className="block">{t("home.mock.heroSubtitleLine1")}</span>
                <span className="block">{t("home.mock.heroSubtitleLine2")}</span>
              </p>
              <div className={`flex flex-wrap items-center ${MOCKUP_HOME.ctaRow}`}>
                <Link
                  href={watchHrefPrimary}
                  className={`inline-flex items-center gap-2 bg-white text-black font-semibold hover:bg-white/90 transition ${MOCKUP_HOME.ctaButton}`}
                >
                  <IconPlay className="w-3.5 h-3.5" />
                  {t("home.mock.startWatching")}
                </Link>
                <Link
                  href="/uploader/upload"
                  className={`inline-flex items-center border border-white/30 text-white font-medium hover:bg-white/[0.06] transition ${MOCKUP_HOME.ctaButton}`}
                >
                  {t("home.mock.uploadStory")}
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      <div
        className={`relative z-10 bg-xiio-bg ${MOCKUP_HOME.pageShell} ${MOCKUP_HOME.contentBodyGuard} pb-16 flex flex-col ${MOCKUP_HOME.sectionGap}`}
      >
        {featuredStories.length > 0 ? (
          <HomeContentRow
            title={t("home.mock.featuredStories")}
            viewAllHref="/movies"
            viewAllLabel={t("home.mock.viewAll")}
            items={featuredStories}
            variant="featured"
          />
        ) : null}

        {surfaceStories.length > 0 ? (
          <HomeSurfaceCampusRow
            title={t("home.mock.newToSurface")}
            viewAllHref="/movies"
            viewAllLabel={t("home.mock.viewAll")}
            items={surfaceStories}
          />
        ) : null}

        {selectsStories.length > 0 ? (
          <HomeContentRow
            title={t("home.mock.xiioSelects")}
            viewAllHref="/series"
            viewAllLabel={t("home.mock.viewAll")}
            items={selectsStories}
            variant="selects"
          />
        ) : null}
      </div>

      <AdminHomeColorPicker />
    </main>
  );
}
