"use client";

import Link from "next/link";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
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
import { MOCKUP_MEASURES } from "@/lib/mockupLayout";
import { HERO_DESIGN } from "@/lib/homeHeroLayout";

export default function HomeMockPage() {
  const { t } = useTranslations();
  const { user } = useAuth();
  const { rgbTuple, overlayEnabled, heroStyle } = useHomeHeroTheme();
  const { waveRect, registerHeroSection, registerHeroText } = useHeroWaveLayout();
  const { items: promoItems } = usePromoFeed(true);
  const heroTextRef = useRef<HTMLDivElement>(null);
  const heroSectionRef = useRef<HTMLElement>(null);
  const [gradStart, setGradStart] = useState(
    HERO_DESIGN.gradFlatPercent + HERO_DESIGN.gradStartOffsetPercent
  );
  const [isLg, setIsLg] = useState(false);

  const setHeroSectionRef = useCallback(
    (el: HTMLElement | null) => {
      heroSectionRef.current = el;
      registerHeroSection(el);
    },
    [registerHeroSection]
  );

  const setHeroTextRef = useCallback(
    (el: HTMLDivElement | null) => {
      heroTextRef.current = el;
      registerHeroText(el);
    },
    [registerHeroText]
  );

  const featuredPromo = promoItems[0];
  const featuredTitle = featuredPromo?.title ?? DEFAULT_FEATURED_STORY.title;
  const featuredMeta = featuredPromo
    ? `Short Film • promo`
    : `${DEFAULT_FEATURED_STORY.category} • ${DEFAULT_FEATURED_STORY.duration}`;

  useLayoutEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const syncLg = () => setIsLg(mq.matches);
    syncLg();
    mq.addEventListener("change", syncLg);
    return () => mq.removeEventListener("change", syncLg);
  }, []);

  useLayoutEffect(() => {
    const section = heroSectionRef.current;
    const text = heroTextRef.current;
    if (!section || !text) return;

    const measure = () => {
      const lg = window.matchMedia("(min-width: 1024px)").matches;
      if (!lg) {
        setGradStart(HERO_DESIGN.gradFlatPercent + HERO_DESIGN.gradStartOffsetPercent);
        return;
      }
      const sr = section.getBoundingClientRect();
      const tr = text.getBoundingClientRect();
      const startPx = Math.max(0, tr.right - sr.left);
      const base = sr.width > 0 ? (startPx / sr.width) * 100 : HERO_DESIGN.gradFlatPercent;
      setGradStart(Math.min(100, Math.round((base + HERO_DESIGN.gradStartOffsetPercent) * 10) / 10));
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(section);
    ro.observe(text);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  const watchHref = user ? "/movies" : "/login";

  const backdropBandHeight =
    waveRect.height - waveRect.backdropTop + waveRect.backdropExtendBottom;
  const heroGridBandStyle = isLg
    ? {
        marginTop: waveRect.backdropTop - MOCKUP_MEASURES.topBarHeight,
        minHeight: backdropBandHeight,
      }
    : undefined;

  return (
    <main className={`min-h-screen min-w-0 w-full ${MOCKUP_HOME.pageShell}`} style={heroStyle}>
      <section
        ref={setHeroSectionRef}
        className={`relative isolate flex min-w-0 w-full flex-col overflow-hidden -mt-[60px] pt-[60px] ${MOCKUP_HOME.heroSection}`}
        style={{ minHeight: waveRect.height + waveRect.backdropExtendBottom }}
      >
        <HeroLandscapeBackdrop
          rgbTuple={rgbTuple}
          overlayEnabled={overlayEnabled}
          variant="home"
          gradStartPercent={gradStart}
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
              className={`min-w-0 ${MOCKUP_HOME.heroTextColumn} ${MOCKUP_HOME.heroTextBottom}`}
            >
              <h1 className={MOCKUP_HOME.heroTitle}>
                <span className="block text-white">{t("home.mock.heroLine1")}</span>
                <span className="block text-white">
                  <em className="italic" style={{ color: MOCKUP_HOME.accentBlue }}>
                    {t("home.mock.heroAccent")}
                  </em>{" "}
                  {t("home.mock.heroLine2")}
                </span>
              </h1>
              <p className={MOCKUP_HOME.heroSubtitle}>{t("home.mock.heroSubtitle")}</p>
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
        className={`relative z-10 bg-[#05070A] ${MOCKUP_HOME.pageShell} ${MOCKUP_HOME.contentRightPad} ${MOCKUP_HOME.contentBodyGuard} pb-16 flex flex-col ${MOCKUP_HOME.sectionGap}`}
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
