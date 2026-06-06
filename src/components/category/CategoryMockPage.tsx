"use client";

import Link from "next/link";
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import ContentCard from "@/components/ContentCard";
import HomeContentRow from "@/components/home/HomeContentRow";
import HomeFeaturedStoryPanel from "@/components/home/HomeFeaturedStoryPanel";
import HeroLandscapeBackdrop from "@/components/hero/HeroLandscapeBackdrop";
import { IconPlay } from "@/components/icons/MockupIcons";
import { useAuth } from "@/context/AuthContext";
import { useHeroWaveLayout } from "@/context/HeroWaveLayoutContext";
import { useHomeHeroTheme } from "@/context/HomeHeroThemeContext";
import { useTranslations } from "@/context/LocaleContext";
import { useCatalogFeed } from "@/hooks/useCatalogFeed";
import { catalogItemsToHomeStories } from "@/lib/categoryCatalogAdapter";
import type { HeroBackgroundId } from "@/lib/heroBackgroundPresets";
import { DEFAULT_FEATURED_STORY } from "@/lib/homeMockData";
import {
  HERO_DESIGN,
  heroSectionMinHeight,
  heroTextBandMarginTop,
  heroTextBandMinHeight,
} from "@/lib/homeHeroLayout";
import { MOCKUP_CAMPUS } from "@/lib/mockupCampusSpec";
import { MOCKUP_HOME } from "@/lib/mockupHomeSpec";
import { gradientForTitle, watchHref } from "@/lib/works/catalog-ui";
import type { WorkSection } from "@/types/work";

type CategoryVariant = "films" | "series";

const VARIANT_CONFIG: Record<
  CategoryVariant,
  { section: WorkSection; presetOverride: HeroBackgroundId; viewAllHref: string }
> = {
  films: { section: "movies", presetOverride: "home_wave", viewAllHref: "/movies" },
  series: { section: "series", presetOverride: "campus_wave2", viewAllHref: "/series" },
};

export default function CategoryMockPage({ variant }: { variant: CategoryVariant }) {
  const { t } = useTranslations();
  const { user } = useAuth();
  const { rgbTuple, overlayEnabled, heroStyle } = useHomeHeroTheme();
  const { waveRect, registerHeroSection, registerHeroText } = useHeroWaveLayout();
  const config = VARIANT_CONFIG[variant];
  const i18n = `category.mock.${variant}` as const;
  const { items, loading } = useCatalogFeed(config.section, 12);

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

  const rowItems = useMemo(() => catalogItemsToHomeStories(items), [items]);
  const featured = items[0];
  const featuredTitle = featured?.title ?? DEFAULT_FEATURED_STORY.title;
  const featuredMeta = featured
    ? `${featured.approvedCategory ?? config.section} • ${featured.approvedTags[0] ?? "watch"}`
    : `${DEFAULT_FEATURED_STORY.category} • ${DEFAULT_FEATURED_STORY.duration}`;

  const watchHrefPrimary = user
    ? featured
      ? watchHref(featured.ownerUid, featured.workId)
      : config.viewAllHref
    : "/login";

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

  const heroGridBandStyle = isLg
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
          gradStartPercent={gradStart}
          presetOverride={config.presetOverride}
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
              <p className={MOCKUP_CAMPUS.heroBadge}>{t(`${i18n}.badge`)}</p>
              <h1 className={MOCKUP_HOME.heroTitle}>
                <span className="block text-white">{t(`${i18n}.heroTitle`)}</span>
              </h1>
              <p className={MOCKUP_HOME.heroSubtitle}>
                <span className="block">{t(`${i18n}.heroSubtitleLine1`)}</span>
                <span className="block">{t(`${i18n}.heroSubtitleLine2`)}</span>
              </p>
              <div className={`flex flex-wrap items-center ${MOCKUP_HOME.ctaRow}`}>
                <Link
                  href={watchHrefPrimary}
                  className={`inline-flex items-center gap-2 bg-white text-black font-semibold hover:bg-white/90 transition ${MOCKUP_HOME.ctaButton}`}
                >
                  <IconPlay className="w-3.5 h-3.5" />
                  {t(`${i18n}.startWatching`)}
                </Link>
                <Link
                  href="/uploader/upload"
                  className={`inline-flex items-center border border-white/30 text-white font-medium hover:bg-white/[0.06] transition ${MOCKUP_HOME.ctaButton}`}
                >
                  {t(`${i18n}.uploadStory`)}
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
        {rowItems.length > 0 ? (
          <HomeContentRow
            title={t(`${i18n}.spotlightTitle`)}
            viewAllHref={config.viewAllHref}
            viewAllLabel={t("home.mock.viewAll")}
            items={rowItems}
            variant="featured"
          />
        ) : null}

        <section>
          <div className={MOCKUP_CAMPUS.sectionHeaderRow}>
            <div className={MOCKUP_CAMPUS.sectionLabelRow}>
              <span className={MOCKUP_CAMPUS.sectionDot} aria-hidden />
              <h2 className={MOCKUP_CAMPUS.sectionLabel}>{t(`${i18n}.allTitle`)}</h2>
            </div>
          </div>

          {loading ? (
            <p className="text-white/45">{t("common.loading")}</p>
          ) : items.length === 0 ? (
            <p className="text-white/45">{t("catalog.empty")}</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {items.map((item) => (
                <ContentCard
                  key={item.id}
                  href={watchHref(item.ownerUid, item.workId)}
                  title={item.title}
                  contentCategory={item.approvedCategory}
                  tags={item.approvedTags}
                  thumbnailUrl={item.thumbnailUrl}
                  gradient={gradientForTitle(item.title)}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
