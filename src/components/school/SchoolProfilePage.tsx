"use client";

import Link from "next/link";
import { useCallback } from "react";
import AdminHomeColorPicker from "@/components/home/AdminHomeColorPicker";
import HomeFeaturedStoryPanel from "@/components/home/HomeFeaturedStoryPanel";
import HomeStoryCard from "@/components/home/HomeStoryCard";
import HeroLandscapeBackdrop from "@/components/hero/HeroLandscapeBackdrop";
import SectionLabel from "@/components/layout/SectionLabel";
import { useHeroWaveLayout } from "@/context/HeroWaveLayoutContext";
import { useHomeHeroTheme } from "@/context/HomeHeroThemeContext";
import { useTranslations } from "@/context/LocaleContext";
import { catalogItemsToHomeStories } from "@/lib/categoryCatalogAdapter";
import type { HomeStoryItem } from "@/lib/homeMockData";
import {
  heroSectionMinHeight,
  heroTextBandMarginTop,
  heroTextBandMinHeight,
} from "@/lib/homeHeroLayout";
import { MOCKUP_CAMPUS } from "@/lib/mockupCampusSpec";
import { MOCKUP_HOME } from "@/lib/mockupHomeSpec";
import { schoolBrandWashGradient } from "@/lib/school-brand";
import type { CampusBackgroundId } from "@/lib/heroBackgroundPresets";
import type { SchoolListItem, SchoolStats } from "@/types/school";
import type { CatalogFeedItem } from "@/types/work";

type Props = {
  school: SchoolListItem;
  stats: SchoolStats;
  latest: CatalogFeedItem[];
  mostViewed: CatalogFeedItem[];
  representative: CatalogFeedItem | null;
  heroPreset: CampusBackgroundId;
};

function StoryGrid({ items }: { items: HomeStoryItem[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {items.map((item) => (
        <HomeStoryCard key={item.id} item={item} variant="featured" />
      ))}
    </div>
  );
}

export default function SchoolProfilePage({
  school,
  stats,
  latest,
  mostViewed,
  representative,
  heroPreset,
}: Props) {
  const { t } = useTranslations();
  const { rgbTuple, overlayEnabled, heroStyle, themeReady } = useHomeHeroTheme();
  const {
    waveRect,
    gradStartPercent,
    layoutReady,
    isLgViewport,
    registerHeroSection,
    registerHeroText,
  } = useHeroWaveLayout();

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
  const repStory = representative ? catalogItemsToHomeStories([representative])[0] : null;
  const latestStories = catalogItemsToHomeStories(latest);
  const mostViewedStories = catalogItemsToHomeStories(mostViewed);

  const heroGridBandStyle = isLgViewport
    ? {
        marginTop: heroTextBandMarginTop(),
        minHeight: heroTextBandMinHeight(waveRect),
      }
    : undefined;

  const statsLine = `${t("schools.profileMovies")} ${stats.movieCount} · ${t(
    "schools.profileSeries"
  )} ${stats.seriesCount} · ${t("schools.profileEntertainment")} ${stats.entertainmentCount}`;

  const representativePanel = repStory ? (
    <Link href={repStory.href ?? `/school/${school.id}`} className="block">
      <HomeFeaturedStoryPanel
        label={t("schools.representative")}
        title={repStory.title}
        meta={repStory.category}
      />
    </Link>
  ) : null;

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
          backgroundScope="campus"
          variant="home"
          presetOverride={heroPreset}
          gradStartPercent={gradStartPercent}
          visualReady={visualReady}
          priority
        />
        <div
          className="absolute inset-0 pointer-events-none z-[1]"
          style={{ background: schoolBrandWashGradient(school.colorPrimary, school.colorSecondary) }}
        />

        <div
          className={`relative z-10 flex flex-1 flex-col ${MOCKUP_HOME.heroInnerMinHeight} ${MOCKUP_HOME.heroContentTop}`}
          style={{ minHeight: waveRect.height }}
        >
          <div className={`flex-1 w-full ${MOCKUP_HOME.heroGrid}`} style={heroGridBandStyle}>
            <div
              ref={setHeroTextRef}
              className={`min-w-0 ${MOCKUP_HOME.heroTextColumnWide} ${MOCKUP_HOME.heroTextColumn} ${MOCKUP_HOME.heroTextBottom}`}
            >
              <Link
                href="/schools"
                className={`${MOCKUP_CAMPUS.heroBadge} inline-flex items-center gap-1 hover:text-sky-300 transition`}
              >
                ← {t("schools.backToSchools")}
              </Link>
              <h1 className={MOCKUP_CAMPUS.heroTitle}>{school.name}</h1>
              <p className={MOCKUP_HOME.heroSubtitle}>{statsLine}</p>
            </div>

            {representativePanel ? (
              <div
                className={`hidden lg:flex min-w-0 max-w-full flex-col justify-end items-end ${MOCKUP_HOME.heroTextBottom}`}
              >
                {representativePanel}
              </div>
            ) : null}
          </div>

          {representativePanel ? (
            <div className="lg:hidden relative z-10 mt-8 px-4">{representativePanel}</div>
          ) : null}
        </div>
      </section>

      <div
        className={`relative z-10 bg-xiio-bg ${MOCKUP_HOME.pageShell} ${MOCKUP_HOME.contentBodyGuard} pb-16 flex flex-col ${MOCKUP_HOME.sectionGap}`}
      >
        {latestStories.length > 0 && (
          <section>
            <div className={MOCKUP_CAMPUS.sectionHeaderRow}>
              <SectionLabel>{t("schools.latest")}</SectionLabel>
            </div>
            <StoryGrid items={latestStories} />
          </section>
        )}

        {mostViewedStories.length > 0 && (
          <section>
            <div className={MOCKUP_CAMPUS.sectionHeaderRow}>
              <SectionLabel>{t("schools.mostViewed")}</SectionLabel>
            </div>
            <StoryGrid items={mostViewedStories} />
          </section>
        )}
      </div>
    </main>
  );
}
