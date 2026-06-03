"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import BattleVsRadar from "@/components/campus/BattleVsRadar";
import CampusSectionLabel from "@/components/campus/CampusSectionLabel";
import SchoolClashBackdrop from "@/components/campus/SchoolClashBackdrop";
import HeroLandscapeBackdrop from "@/components/hero/HeroLandscapeBackdrop";
import { IconPlay } from "@/components/icons/MockupIcons";
import { useHeroWaveLayout } from "@/context/HeroWaveLayoutContext";
import { useHomeHeroTheme } from "@/context/HomeHeroThemeContext";
import { useTranslations } from "@/context/LocaleContext";
import { rgba } from "@/lib/campusBrandColors";
import {
  ACTIVE_BATTLE,
  CURRENT_THEME,
  PAST_BATTLES,
  type CampusSchool,
} from "@/lib/campusMockData";
import { HERO_DESIGN } from "@/lib/homeHeroLayout";
import { MOCKUP_MEASURES } from "@/lib/mockupLayout";
import { MOCKUP_HOME } from "@/lib/mockupHomeSpec";
import { MOCKUP_CAMPUS } from "@/lib/mockupCampusSpec";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function useCountdown(targetMs: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const diff = Math.max(0, targetMs - now);
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  return { days, hours, mins, secs };
}

function splitSchoolName(name: string): { main: string; sub?: string } {
  if (name.endsWith(" UNIVERSITY")) {
    return { main: name.slice(0, -" UNIVERSITY".length), sub: "UNIVERSITY" };
  }
  return { main: name };
}

function SchoolNameBlock({
  name,
  variant = "default",
  align = "center",
}: {
  name: string;
  variant?: "default" | "active";
  align?: "left" | "center" | "right";
}) {
  const { main, sub } = splitSchoolName(name);
  const mainClass =
    variant === "active" ? MOCKUP_CAMPUS.activeSchoolNameMain : MOCKUP_CAMPUS.schoolNameMain;
  const subClass =
    variant === "active" ? MOCKUP_CAMPUS.activeSchoolNameSub : MOCKUP_CAMPUS.schoolNameSub;
  const alignClass =
    align === "left" ? "text-left" : align === "right" ? "text-right" : "text-center";

  return (
    <div className={alignClass}>
      <p className={mainClass}>{main}</p>
      {sub ? <p className={subClass}>{sub}</p> : null}
    </div>
  );
}

function SchoolLogo({
  school,
  size = 96,
  variant = "badge",
  className = "",
}: {
  school: Pick<CampusSchool, "logo" | "name" | "colorPrimary" | "colorSecondary">;
  size?: number;
  variant?: "badge" | "mark";
  className?: string;
}) {
  if (variant === "mark") {
    return (
      <div
        className={`relative shrink-0 ${className}`}
        style={{
          width: size,
          height: size,
          filter: `drop-shadow(0 0 20px ${rgba(school.colorPrimary, 0.35)})`,
        }}
      >
        <Image
          src={school.logo}
          alt={school.name}
          fill
          className="object-contain"
          sizes={`${size}px`}
          unoptimized
        />
      </div>
    );
  }

  const logoPad = size <= 48 ? "p-1.5" : "p-2";
  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-full bg-[#05070A]/70 ${logoPad} ${className}`}
      style={{
        width: size,
        height: size,
        borderWidth: 2,
        borderStyle: "solid",
        borderColor: rgba(school.colorPrimary, 0.55),
        boxShadow: `0 0 0 1px ${rgba(school.colorSecondary, 0.35)}, 0 0 32px ${rgba(school.colorPrimary, 0.45)}, 0 0 12px ${rgba(school.colorPrimary, 0.25)}`,
      }}
    >
      <Image
        src={school.logo}
        alt={school.name}
        fill
        className="object-contain"
        sizes={`${size}px`}
        unoptimized
      />
    </div>
  );
}

function ActiveBattleSchoolCluster({
  side,
  school,
}: {
  side: "left" | "right";
  school: CampusSchool;
}) {
  const isLeft = side === "left";
  const wrapClass = isLeft
    ? "flex min-w-0 flex-1 max-w-[42%] justify-end pr-1 sm:pr-4"
    : "flex min-w-0 flex-1 max-w-[42%] justify-start pl-1 sm:pl-4";

  return (
    <div className={wrapClass}>
      <div className={`${MOCKUP_CAMPUS.activeSchoolRow} justify-center`}>
        {isLeft ? (
          <>
            <SchoolNameBlock name={school.name} variant="active" align="right" />
            <SchoolLogo school={school} size={104} variant="mark" />
          </>
        ) : (
          <>
            <SchoolLogo school={school} size={104} variant="mark" />
            <SchoolNameBlock name={school.name} variant="active" align="left" />
          </>
        )}
      </div>
    </div>
  );
}

function ActiveBattleCountdown({
  countdown,
  votingEndsLabel,
  daysLabel,
  hrsLabel,
  minsLabel,
  secsLabel,
  variant = "default",
}: {
  countdown: { days: number; hours: number; mins: number; secs: number };
  votingEndsLabel: string;
  daysLabel: string;
  hrsLabel: string;
  minsLabel: string;
  secsLabel: string;
  variant?: "default" | "compact";
}) {
  const compact = variant === "compact";
  const labelClass = compact
    ? MOCKUP_CAMPUS.activeCountdownLabel
    : `${MOCKUP_CAMPUS.countdownLabel} mb-2`;
  const digitsClass = compact
    ? MOCKUP_CAMPUS.activeCountdownDigits
    : `${MOCKUP_CAMPUS.countdownDigits} text-xl sm:text-2xl`;

  return (
    <div
      className={`flex shrink-0 flex-col items-center text-center ${
        compact ? "w-full max-w-[min(100%,280px)] px-1" : "w-full max-w-[200px]"
      }`}
    >
      <p className={labelClass}>{votingEndsLabel}</p>
      <div
        className={`grid w-full grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] items-center gap-1 ${digitsClass}`}
      >
        <span className="text-center">{pad(countdown.days)}</span>
        <span className="text-white/30">:</span>
        <span className="text-center">{pad(countdown.hours)}</span>
        <span className="text-white/30">:</span>
        <span className="text-center">{pad(countdown.mins)}</span>
        <span className="text-white/30">:</span>
        <span className="text-center">{pad(countdown.secs)}</span>
      </div>
      <div className={`grid w-full grid-cols-4 gap-1 ${compact ? "mt-1" : "mt-1.5"}`}>
        <span className={`text-center ${MOCKUP_CAMPUS.countdownUnit}`}>{daysLabel}</span>
        <span className={`text-center ${MOCKUP_CAMPUS.countdownUnit}`}>{hrsLabel}</span>
        <span className={`text-center ${MOCKUP_CAMPUS.countdownUnit}`}>{minsLabel}</span>
        <span className={`text-center ${MOCKUP_CAMPUS.countdownUnit}`}>{secsLabel}</span>
      </div>
    </div>
  );
}

export default function CampusMockPage() {
  const { t } = useTranslations();
  const { rgbTuple, overlayEnabled, heroStyle } = useHomeHeroTheme();
  const { waveRect, registerHeroSection, registerHeroText } = useHeroWaveLayout();
  const countdown = useCountdown(ACTIVE_BATTLE.votingEndsAt);
  const { schoolA, schoolB } = ACTIVE_BATTLE;
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

  const backdropBandHeight =
    waveRect.height - waveRect.backdropTop + waveRect.backdropExtendBottom;
  const heroGridBandStyle = isLg
    ? {
        marginTop: waveRect.backdropTop - MOCKUP_MEASURES.topBarHeight,
        minHeight: backdropBandHeight,
      }
    : undefined;

  const filmsVotesA = t("campus.mock.filmsVotes", {
    films: schoolA.films,
    votes: schoolA.votes,
  });
  const filmsVotesB = t("campus.mock.filmsVotes", {
    films: schoolB.films,
    votes: schoolB.votes,
  });

  return (
    <main className={`min-h-screen ${MOCKUP_HOME.pageShell}`} style={heroStyle}>
      <section
        ref={setHeroSectionRef}
        className={`relative isolate flex flex-col overflow-hidden -mt-[60px] pt-[60px] ${MOCKUP_HOME.heroSection}`}
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
              <p className={MOCKUP_CAMPUS.heroBadge}>{t("campus.mock.badge")}</p>
              <h1 className={MOCKUP_CAMPUS.heroTitle}>{t("campus.mock.title")}</h1>
              <p className={MOCKUP_CAMPUS.heroSubtitle}>{t("campus.mock.subtitle")}</p>
              <Link
                href="/about#campus"
                className={`inline-flex items-center gap-2 border border-white/30 text-white font-medium hover:bg-white/[0.06] transition ${MOCKUP_HOME.ctaButton}`}
              >
                <IconPlay className="w-3.5 h-3.5" />
                {t("campus.mock.howItWorks")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div
        className={`relative z-10 bg-[#05070A] ${MOCKUP_HOME.pageShell} ${MOCKUP_HOME.contentRightPad} ${MOCKUP_HOME.contentBodyGuard} pb-16 flex flex-col ${MOCKUP_HOME.sectionGap}`}
      >
        <section>
          <div className={MOCKUP_CAMPUS.sectionHeaderRow}>
            <CampusSectionLabel>{t("campus.mock.activeBattles")}</CampusSectionLabel>
            <Link
              href="/school-battle"
              className={`text-white/40 hover:text-white/70 transition ${MOCKUP_HOME.viewAllLink}`}
            >
              {t("campus.mock.viewAllBattles")} →
            </Link>
          </div>

          <div className={MOCKUP_CAMPUS.activeGrid}>
            <div className={MOCKUP_CAMPUS.battleCard}>
              <SchoolClashBackdrop
                schoolA={schoolA}
                schoolB={schoolB}
                battleId="active"
                variant="active"
              />
              <div className="relative z-10 flex flex-1 flex-col min-h-0">
                <div className={MOCKUP_CAMPUS.activeBattleHero}>
                  <ActiveBattleSchoolCluster side="left" school={schoolA} />
                  <BattleVsRadar size="active" />
                  <ActiveBattleSchoolCluster side="right" school={schoolB} />
                </div>
                <div className={MOCKUP_CAMPUS.activeBattleFooter}>
                  <p className={`${MOCKUP_CAMPUS.activeBattleFooterStats} text-left`}>
                    {filmsVotesA}
                  </p>
                  <ActiveBattleCountdown
                    variant="compact"
                    countdown={countdown}
                    votingEndsLabel={t("campus.mock.votingEnds")}
                    daysLabel={t("campus.mock.days")}
                    hrsLabel={t("campus.mock.hrs")}
                    minsLabel={t("campus.mock.mins")}
                    secsLabel={t("campus.mock.secs")}
                  />
                  <p className={`${MOCKUP_CAMPUS.activeBattleFooterStats} text-right`}>
                    {filmsVotesB}
                  </p>
                </div>
              </div>
            </div>

            <div className={`${MOCKUP_CAMPUS.themeCard} bg-gradient-to-br ${CURRENT_THEME.gradient}`}>
              {CURRENT_THEME.image ? (
                <div className="absolute inset-0 z-0">
                  <Image
                    src={CURRENT_THEME.image}
                    alt=""
                    fill
                    className="object-cover object-center opacity-40"
                    sizes="280px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                </div>
              ) : null}
              <div className={MOCKUP_CAMPUS.themeCardInner}>
                <p className="text-[10px] font-bold tracking-[0.2em] text-sky-300 uppercase mb-1">
                  {t("campus.mock.currentTheme")}
                </p>
                <h3 className="text-lg font-bold text-white mb-3">{t("campus.mock.themeTitle")}</h3>
                <p className="text-sm text-white/60 flex-1">{t("campus.mock.themeDescription")}</p>
                <button
                  type="button"
                  className="mt-4 inline-flex items-center gap-1 text-sm text-sky-300 hover:text-sky-200"
                >
                  {t("campus.mock.viewBrief")} ↗
                </button>
              </div>
            </div>
          </div>
        </section>

        <section>
          <CampusSectionLabel>{t("campus.mock.pastBattles")}</CampusSectionLabel>

          <div className={`${MOCKUP_CAMPUS.pastGrid} mt-5`}>
            <div className={MOCKUP_CAMPUS.pastCardsGrid}>
              {PAST_BATTLES.map((b) => (
                <div key={b.id} className={MOCKUP_CAMPUS.pastCard}>
                  <SchoolClashBackdrop
                    schoolA={b.schoolA}
                    schoolB={b.schoolB}
                    battleId={b.id}
                    variant="compact"
                  />
                  <div className="relative z-10 flex w-full flex-col items-center text-center">
                    <div className="mb-2.5 flex items-center gap-3">
                      <SchoolLogo school={b.schoolA} size={44} variant="badge" />
                      <span className="text-[10px] font-bold text-white/25">vs</span>
                      <SchoolLogo school={b.schoolB} size={44} variant="badge" />
                    </div>
                    <p className="mb-1 text-xs font-semibold text-white/70">
                      {b.schoolA.name} vs {b.schoolB.name}
                    </p>
                    <p className="text-[11px] text-sky-400">
                      {t("campus.mock.winner")} {b.winner}
                    </p>
                    <p className="mt-1 text-[11px] text-white/40">
                      {b.votes} {t("campus.mock.votes")}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className={MOCKUP_CAMPUS.aboutCard}>
              <h3 className="text-xs font-bold tracking-[0.15em] uppercase mb-2">
                {t("campus.mock.aboutTitle")}
              </h3>
              <p className="text-sm text-white/55 leading-relaxed mb-3">{t("campus.mock.aboutBody")}</p>
              <Link href="/about#campus" className="text-sm text-sky-400 hover:text-sky-300">
                {t("campus.mock.learnMore")} →
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
