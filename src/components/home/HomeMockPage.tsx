"use client";

import Link from "next/link";
import { useLayoutEffect, useRef, useState } from "react";
import AdminHomeColorPicker from "@/components/home/AdminHomeColorPicker";
import HomeContentRow from "@/components/home/HomeContentRow";
import HeroLandscapeBackdrop from "@/components/hero/HeroLandscapeBackdrop";
import { useAuth } from "@/context/AuthContext";
import { useHomeHeroTheme } from "@/context/HomeHeroThemeContext";
import { useTranslations } from "@/context/LocaleContext";
import {
  DEFAULT_FEATURED_STORY,
  FEATURED_STORIES,
  SELECTS_STORIES,
  SURFACE_STORIES,
} from "@/lib/homeMockData";
import { HERO_DESIGN } from "@/lib/homeHeroLayout";

export default function HomeMockPage() {
  const { t } = useTranslations();
  const { user } = useAuth();
  const { rgbTuple, heroStyle } = useHomeHeroTheme();
  const heroTextRef = useRef<HTMLDivElement>(null);
  const heroSectionRef = useRef<HTMLElement>(null);
  const [gradStart, setGradStart] = useState(
    HERO_DESIGN.gradFlatPercent + HERO_DESIGN.gradStartOffsetPercent
  );

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
        className="relative min-h-[clamp(420px,55vh,560px)] flex flex-col justify-end px-4 sm:px-6 lg:px-10 pb-10"
      >
        <HeroLandscapeBackdrop rgbTuple={rgbTuple} variant="home" gradStartPercent={gradStart} priority />

        <div ref={heroTextRef} className="relative z-10 max-w-2xl">
          <h1 className="font-serif text-[clamp(2.5rem,5vw,4.5rem)] leading-[1.05] text-white mb-4">
            {t("home.mock.heroLine1")}{" "}
            <em className="text-sky-300 italic">{t("home.mock.heroAccent")}</em>{" "}
            {t("home.mock.heroLine2")}
          </h1>
          <p className="text-white/60 text-sm sm:text-base max-w-md mb-6 leading-relaxed">
            {t("home.mock.heroSubtitle")}
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href={watchHref}
              className="inline-flex items-center gap-2 rounded-full bg-white text-black px-6 py-2.5 text-sm font-semibold hover:bg-white/90 transition"
            >
              <span aria-hidden>▶</span>
              {t("home.mock.startWatching")}
            </Link>
            <Link
              href="/uploader/upload"
              className="inline-flex items-center rounded-full border border-white/35 text-white px-6 py-2.5 text-sm font-medium hover:bg-white/10 transition"
            >
              {t("home.mock.uploadStory")}
            </Link>
          </div>
        </div>

        <div className="relative z-10 mt-8 flex items-end justify-between gap-4">
          <p className="text-[11px] uppercase tracking-wider text-white/45 hidden sm:block">
            {t("home.mock.featuredLabel")}: {DEFAULT_FEATURED_STORY.title} | {DEFAULT_FEATURED_STORY.category} ·{" "}
            {DEFAULT_FEATURED_STORY.duration}
          </p>
          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              className="w-9 h-9 rounded-full border border-white/25 flex items-center justify-center text-white/80 hover:bg-white/10"
              aria-label={t("home.mock.playFeatured")}
            >
              ▶
            </button>
            <div className="flex gap-1.5">
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className={`h-0.5 rounded-full ${i === 0 ? "w-6 bg-white" : "w-3 bg-white/30"}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="px-4 sm:px-6 lg:px-10 pb-16 space-y-10">
        <HomeContentRow
          title={t("home.mock.featuredStories")}
          viewAllHref="/movies"
          viewAllLabel={t("home.mock.viewAll")}
          items={FEATURED_STORIES}
          size="featured"
        />

        <div className="grid lg:grid-cols-[1fr_minmax(280px,360px)] gap-6 items-start">
          <HomeContentRow
            title={t("home.mock.newToSurface")}
            viewAllHref="/movies"
            viewAllLabel={t("home.mock.viewAll")}
            items={SURFACE_STORIES}
            size="compact"
          />

          <Link
            href="/school-battle"
            className="relative rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-br from-sky-950/80 via-[#0a1628] to-black p-6 min-h-[200px] flex flex-col justify-end hover:border-sky-500/30 transition"
          >
            <p className="text-[10px] font-bold tracking-[0.2em] text-sky-400 uppercase mb-2">
              {t("home.mock.campusBannerTitle")}
            </p>
            <p className="text-white/75 text-sm leading-relaxed mb-4">{t("home.mock.campusBannerBody")}</p>
            <span className="text-sm text-sky-300 font-medium">{t("home.mock.exploreBattles")} →</span>
            <div className="absolute top-4 right-4 flex -space-x-2">
              {["A", "B", "C"].map((l) => (
                <span
                  key={l}
                  className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-[10px] text-white/70"
                >
                  {l}
                </span>
              ))}
              <span className="w-8 h-8 rounded-full bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-[10px] text-sky-300">
                +12
              </span>
            </div>
          </Link>
        </div>

        <HomeContentRow
          title={t("home.mock.xiioSelects")}
          viewAllHref="/series"
          viewAllLabel={t("home.mock.viewAll")}
          items={SELECTS_STORIES}
          size="featured"
        />
      </div>

      <AdminHomeColorPicker />
    </main>
  );
}
