"use client";

import Link from "next/link";
import { useLayoutEffect, useRef, useState } from "react";
import AdminHomeColorPicker from "@/components/home/AdminHomeColorPicker";
import HomeContentRow from "@/components/home/HomeContentRow";
import HomeFeaturedStoryPanel from "@/components/home/HomeFeaturedStoryPanel";
import HomeSurfaceCampusRow from "@/components/home/HomeSurfaceCampusRow";
import HeroLandscapeBackdrop from "@/components/hero/HeroLandscapeBackdrop";
import { IconPlay } from "@/components/icons/MockupIcons";
import { useAuth } from "@/context/AuthContext";
import { useHomeHeroTheme } from "@/context/HomeHeroThemeContext";
import { useTranslations } from "@/context/LocaleContext";
import { usePromoFeed } from "@/hooks/usePromoFeed";
import {
  DEFAULT_FEATURED_STORY,
  FEATURED_STORIES,
  SELECTS_STORIES,
  SURFACE_STORIES,
} from "@/lib/homeMockData";
import { MOCKUP_HOME, MOCKUP_HOME_STYLES } from "@/lib/mockupHomeSpec";
import { HERO_DESIGN } from "@/lib/homeHeroLayout";

export default function HomeMockPage() {
  const { t } = useTranslations();
  const { user } = useAuth();
  const { rgbTuple, overlayEnabled, heroStyle } = useHomeHeroTheme();
  const { items: promoItems } = usePromoFeed(true);
  const heroTextRef = useRef<HTMLDivElement>(null);
  const heroSectionRef = useRef<HTMLElement>(null);
  const [gradStart, setGradStart] = useState(
    HERO_DESIGN.gradFlatPercent + HERO_DESIGN.gradStartOffsetPercent
  );

  const featuredPromo = promoItems[0];
  const featuredTitle = featuredPromo?.title ?? DEFAULT_FEATURED_STORY.title;
  const featuredMeta = featuredPromo
    ? `Short Film · promo`
    : `${DEFAULT_FEATURED_STORY.category} · ${DEFAULT_FEATURED_STORY.duration}`;

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

  return (
    <main className={`min-h-screen ${MOCKUP_HOME.pageShell}`} style={heroStyle}>
      <section
        ref={heroSectionRef}
        className="relative flex flex-col overflow-hidden -mt-[calc(60px*var(--frame-scale))] pt-[calc(60px*var(--frame-scale))] lg:pr-[calc(76px*var(--frame-scale))]"
        style={MOCKUP_HOME_STYLES.heroSection}
      >
        <HeroLandscapeBackdrop
          rgbTuple={rgbTuple}
          overlayEnabled={overlayEnabled}
          variant="home"
          gradStartPercent={gradStart}
          priority
        />

        <div className="relative z-10 flex flex-1 flex-col justify-end" style={MOCKUP_HOME_STYLES.heroContentTop}>
          <div
            className="w-full lg:grid lg:items-end"
            style={MOCKUP_HOME_STYLES.heroGrid}
          >
            <div
              ref={heroTextRef}
              className="flex flex-col justify-end px-4 lg:px-0"
              style={MOCKUP_HOME_STYLES.heroTextBottom}
            >
              <h1
                className="font-serif font-normal leading-[1.08] text-white mb-4 tracking-tight"
                style={MOCKUP_HOME_STYLES.heroTitle}
              >
                {t("home.mock.heroLine1")}{" "}
                <em className="italic" style={{ color: MOCKUP_HOME.accentBlue }}>
                  {t("home.mock.heroAccent")}
                </em>{" "}
                {t("home.mock.heroLine2")}
              </h1>
              <p
                className="text-white/55 mb-7 leading-relaxed"
                style={MOCKUP_HOME_STYLES.heroSubtitle}
              >
                {t("home.mock.heroSubtitle")}
              </p>
              <div className="flex flex-wrap items-center" style={MOCKUP_HOME_STYLES.ctaRow}>
                <Link
                  href={watchHref}
                  className="inline-flex items-center gap-2 rounded-full bg-white text-black font-semibold hover:bg-white/90 transition"
                  style={MOCKUP_HOME_STYLES.ctaButton}
                >
                  <IconPlay className="w-[calc(14px*var(--frame-scale))] h-[calc(14px*var(--frame-scale))]" />
                  {t("home.mock.startWatching")}
                </Link>
                <Link
                  href="/uploader/upload"
                  className="inline-flex items-center rounded-full border border-white/30 text-white font-medium hover:bg-white/[0.06] transition"
                  style={MOCKUP_HOME_STYLES.ctaButton}
                >
                  {t("home.mock.uploadStory")}
                </Link>
              </div>
            </div>

            <div className="hidden lg:flex flex-col justify-end items-end" style={MOCKUP_HOME_STYLES.heroTextBottom}>
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

          <div className="relative z-10 px-4 lg:px-0" style={MOCKUP_HOME_STYLES.heroToFeaturedHeader}>
            <HomeContentRow
              headerOnly
              title={t("home.mock.featuredStories")}
              viewAllHref="/movies"
              viewAllLabel={t("home.mock.viewAll")}
              items={FEATURED_STORIES}
              variant="featured"
            />
          </div>
        </div>
      </section>

      <div
        className={`relative z-10 bg-[#05070A] ${MOCKUP_HOME.pageShell} pb-16 flex flex-col lg:pr-[calc(76px*var(--frame-scale))]`}
        style={MOCKUP_HOME_STYLES.sectionGap}
      >
        <div style={MOCKUP_HOME_STYLES.featuredHeaderToCards}>
          <HomeContentRow
            hideHeader
          title={t("home.mock.featuredStories")}
          viewAllHref="/movies"
          viewAllLabel={t("home.mock.viewAll")}
          items={FEATURED_STORIES}
          variant="featured"
          />
        </div>

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
