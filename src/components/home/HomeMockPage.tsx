"use client";

import Link from "next/link";
import { useLayoutEffect, useRef, useState } from "react";
import AdminHomeColorPicker from "@/components/home/AdminHomeColorPicker";
import CampusCurrentsBanner from "@/components/home/CampusCurrentsBanner";
import HomeContentRow from "@/components/home/HomeContentRow";
import HomeFeaturedStoryPanel from "@/components/home/HomeFeaturedStoryPanel";
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
import { MOCKUP_HOME } from "@/lib/mockupHomeSpec";
import { HERO_DESIGN } from "@/lib/homeHeroLayout";

export default function HomeMockPage() {
  const { t } = useTranslations();
  const { user } = useAuth();
  const { rgbTuple, heroStyle } = useHomeHeroTheme();
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
    <main className="min-h-screen" style={heroStyle}>
      <section
        ref={heroSectionRef}
        className={`relative overflow-hidden ${MOCKUP_HOME.heroMinHeight} ${MOCKUP_HOME.pageGutter} pb-10 pt-6 lg:pt-10`}
      >
        <HeroLandscapeBackdrop rgbTuple={rgbTuple} variant="home" gradStartPercent={gradStart} priority />

        <div className={`relative z-10 ${MOCKUP_HOME.pageMaxWidth} ${MOCKUP_HOME.heroGrid}`}>
          <div ref={heroTextRef} className="flex flex-col justify-end pb-4 lg:pb-8">
            <h1 className="font-sans font-bold text-[clamp(2.25rem,4.5vw,4rem)] leading-[1.08] text-white mb-4 tracking-tight">
              {t("home.mock.heroLine1")}{" "}
              <em className="font-serif italic" style={{ color: MOCKUP_HOME.accentBlue }}>
                {t("home.mock.heroAccent")}
              </em>{" "}
              {t("home.mock.heroLine2")}
            </h1>
            <p className="text-white/55 text-sm sm:text-[15px] max-w-md mb-7 leading-relaxed">
              {t("home.mock.heroSubtitle")}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={watchHref}
                className="inline-flex items-center gap-2 rounded-full bg-white text-black px-6 py-2.5 text-sm font-semibold hover:bg-white/90 transition"
              >
                <IconPlay className="w-3.5 h-3.5" />
                {t("home.mock.startWatching")}
              </Link>
              <Link
                href="/uploader/upload"
                className="inline-flex items-center rounded-full border border-white/30 text-white px-6 py-2.5 text-sm font-medium hover:bg-white/[0.06] transition"
              >
                {t("home.mock.uploadStory")}
              </Link>
            </div>
          </div>

          <div className="hidden lg:flex flex-col justify-end items-end pb-6">
            <HomeFeaturedStoryPanel
              label={t("home.mock.featuredLabel")}
              title={featuredTitle}
              meta={featuredMeta}
            />
          </div>
        </div>

        <div className="lg:hidden relative z-10 mt-8 px-0">
          <HomeFeaturedStoryPanel
            label={t("home.mock.featuredLabel")}
            title={featuredTitle}
            meta={featuredMeta}
          />
        </div>
      </section>

      <div className={`relative z-10 bg-[#05070A] ${MOCKUP_HOME.pageGutter} pb-16 space-y-10 ${MOCKUP_HOME.pageMaxWidth}`}>
        <HomeContentRow
          title={t("home.mock.featuredStories")}
          viewAllHref="/movies"
          viewAllLabel={t("home.mock.viewAll")}
          items={FEATURED_STORIES}
          variant="featured"
        />

        <div className="flex flex-col lg:flex-row gap-6 items-start">
          <div className="flex-1 min-w-0 w-full">
            <HomeContentRow
              title={t("home.mock.newToSurface")}
              viewAllHref="/movies"
              viewAllLabel={t("home.mock.viewAll")}
              items={SURFACE_STORIES}
              variant="surface"
              showScrollButton
            />
          </div>
          <CampusCurrentsBanner />
        </div>

        <HomeContentRow
          title={t("home.mock.xiioSelects")}
          viewAllHref="/series"
          viewAllLabel={t("home.mock.viewAll")}
          items={SELECTS_STORIES}
          variant="featured"
        />
      </div>

      <AdminHomeColorPicker />
    </main>
  );
}
