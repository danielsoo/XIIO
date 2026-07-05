"use client";

import Link from "next/link";
import { useCallback } from "react";
import AdminHomeColorPicker from "@/components/home/AdminHomeColorPicker";
import HeroLandscapeBackdrop from "@/components/hero/HeroLandscapeBackdrop";
import { useHeroWaveLayout } from "@/context/HeroWaveLayoutContext";
import { useHomeHeroTheme } from "@/context/HomeHeroThemeContext";
import { useTranslations } from "@/context/LocaleContext";
import {
  heroSectionMinHeight,
  heroTextBandMarginTop,
  heroTextBandMinHeight,
} from "@/lib/homeHeroLayout";
import { MOCKUP_CAMPUS } from "@/lib/mockupCampusSpec";
import { MOCKUP_HOME } from "@/lib/mockupHomeSpec";
import SchoolPosterCard from "@/components/school/SchoolPosterCard";
import type { SchoolListItem } from "@/types/school";

export default function SchoolsDirectoryPage({ schools }: { schools: SchoolListItem[] }) {
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
          backgroundScope="campus"
          variant="home"
          gradStartPercent={gradStartPercent}
          visualReady={visualReady}
          priority
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
              <p className={MOCKUP_CAMPUS.heroBadge}>{t("schools.heroBadge")}</p>
              <h1 className={MOCKUP_HOME.heroTitle}>
                <span className="block text-white">{t("schools.directoryTitle")}</span>
              </h1>
              <p className={MOCKUP_HOME.heroSubtitle}>{t("schools.directorySubtitle")}</p>
              <div className={`flex flex-wrap items-center ${MOCKUP_HOME.ctaRow}`}>
                <Link
                  href="/uploader/upload"
                  className={`inline-flex items-center border border-white/30 text-white font-medium hover:bg-white/[0.06] transition ${MOCKUP_HOME.ctaButton}`}
                >
                  {t("schools.heroCta")}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div
        className={`relative z-10 bg-xiio-bg ${MOCKUP_HOME.pageShell} ${MOCKUP_HOME.contentBodyGuard} pb-16 flex flex-col ${MOCKUP_HOME.sectionGap}`}
      >
        {schools.length === 0 ? (
          <p className="text-white/45">{t("schools.empty")}</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {schools.map((school) => (
              <SchoolPosterCard key={school.id} school={school} />
            ))}
          </div>
        )}
      </div>

      <AdminHomeColorPicker />
    </main>
  );
}
