"use client";

import Link from "next/link";
import { useCallback } from "react";
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
import { usePromoFeed } from "@/hooks/usePromoFeed";
import {
  DEFAULT_FEATURED_STORY,
  FEATURED_STORIES,
  SELECTS_STORIES,
  SURFACE_STORIES,
} from "@/lib/homeMockData";
import { MOCKUP_HOME } from "@/lib/mockupHomeSpec";
import {
  heroSectionMinHeight,
  heroTextBandMarginTop,
  heroTextBandMinHeight,
} from "@/lib/homeHeroLayout";

export default function HomeMockPage() {
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
  const { items: promoItems } = usePromoFeed(true);

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
    ? `Short Film • promo`
    : `${DEFAULT_FEATURED_STORY.category} • ${DEFAULT_FEATURED_STORY.duration}`;

  const watchHref = user ? "/movies" : "/login";

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
        className={`relative isolate flex min-w-0 w-full flex-col overflow-hidden -mt-[60px] pt-[60px] ${MOCKUP_HOME.heroSection}`}
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
        />

        <div
          className={`relative z-10 flex flex-1 flex-col ${MOCKUP_HOME.heroInnerMinHeight} ${MOCKUP_HOME.contentRightPad} ${MOCKUP_HOME.heroContentTop}`}
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
                  href={watchHref}
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

            <div
              className={`hidden lg:flex min-w-0 max-w-full flex-col justify-end items-end ${MOCKUP_HOME.heroTextBottom}`}
            >
              <HomeFeaturedStoryPanel
                label={t("home.mock.featuredLabel")}
                title={featuredTitle}
                meta={featuredMeta}
              />
            </div>
          </div>

          <div className="lg:hidden relative z-10 mt-8 px-4">
            <HomeFeaturedStoryPanel
              label={t("home.mock.featuredLabel")}
              title={featuredTitle}
              meta={featuredMeta}
            />
          </div>
        </div>
      </section>

      <div
        className={`relative z-10 bg-xiio-bg ${MOCKUP_HOME.pageShell} ${MOCKUP_HOME.contentRightPad} ${MOCKUP_HOME.contentBodyGuard} pb-16 flex flex-col ${MOCKUP_HOME.sectionGap}`}
      >
        <HomeContentRow
          title={t("home.mock.featuredStories")}
          viewAllHref="/movies"
          viewAllLabel={t("home.mock.viewAll")}
          items={FEATURED_STORIES}
          variant="featured"
        />

        <HomeSurfaceCampusRow
          title={t("home.mock.newToSurface")}
          viewAllHref="/movies"
          viewAllLabel={t("home.mock.viewAll")}
          items={SURFACE_STORIES}
        />

        <HomeContentRow
          title={t("home.mock.xiioSelects")}
          viewAllHref="/series"
          viewAllLabel={t("home.mock.viewAll")}
          items={SELECTS_STORIES}
          variant="selects"
        />
      </div>

      <AdminHomeColorPicker />
    </main>
  );
}
