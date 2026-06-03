"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import BattleVsRadar from "@/components/campus/BattleVsRadar";
import CampusSectionLabel from "@/components/campus/CampusSectionLabel";
import SchoolClashBackdrop from "@/components/campus/SchoolClashBackdrop";
import HeroLandscapeBackdrop from "@/components/hero/HeroLandscapeBackdrop";
import { IconPlay } from "@/components/icons/MockupIcons";
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

function SchoolLogo({
  school,
  size = 96,
  className = "",
}: {
  school: Pick<CampusSchool, "logo" | "name" | "colorPrimary" | "colorSecondary">;
  size?: number;
  className?: string;
}) {
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

function SchoolBadge({
  school,
  filmsVotesLabel,
}: {
  school: CampusSchool;
  filmsVotesLabel: string;
}) {
  const [mainName, ...rest] = school.name.split(" ");
  const subName = rest.join(" ");

  return (
    <div className="flex flex-1 flex-col items-center gap-3 text-center">
      <SchoolLogo school={school} size={96} />
      <div>
        <p className={MOCKUP_CAMPUS.schoolNameMain}>{mainName}</p>
        {subName ? <p className={MOCKUP_CAMPUS.schoolNameSub}>{subName}</p> : null}
      </div>
      <p className={MOCKUP_CAMPUS.schoolStats}>{filmsVotesLabel}</p>
    </div>
  );
}

export default function CampusMockPage() {
  const { t } = useTranslations();
  const { rgbTuple, overlayEnabled, heroStyle } = useHomeHeroTheme();
  const countdown = useCountdown(ACTIVE_BATTLE.votingEndsAt);
  const { schoolA, schoolB } = ACTIVE_BATTLE;

  const gradStart =
    HERO_DESIGN.gradFlatPercent + HERO_DESIGN.gradStartOffsetPercent;

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
      <section className="relative min-h-[320px] flex flex-col justify-center overflow-hidden -mt-[60px] pt-[60px]">
        <HeroLandscapeBackdrop
          rgbTuple={rgbTuple}
          overlayEnabled={overlayEnabled}
          variant="compact"
          gradStartPercent={gradStart}
          priority
        />

        <div
          className={`relative z-10 max-w-3xl px-4 lg:px-0 ${MOCKUP_HOME.contentRightPad}`}
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
      </section>

      <div
        className={`relative z-10 bg-[#05070A] ${MOCKUP_HOME.pageShell} pb-16 flex flex-col ${MOCKUP_HOME.contentRightPad} ${MOCKUP_HOME.sectionGap}`}
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
              <div className="relative z-10">
                <div className="mb-8 flex items-center justify-between gap-4">
                  <SchoolBadge school={schoolA} filmsVotesLabel={filmsVotesA} />
                  <BattleVsRadar />
                  <SchoolBadge school={schoolB} filmsVotesLabel={filmsVotesB} />
                </div>

                <div className="border-t border-white/10 pt-6 text-center">
                  <p className={MOCKUP_CAMPUS.countdownLabel}>{t("campus.mock.votingEnds")}</p>
                  <div
                    className={`mx-auto grid max-w-md grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] items-center gap-2 sm:gap-3 ${MOCKUP_CAMPUS.countdownDigits}`}
                  >
                    <span className="text-center">{pad(countdown.days)}</span>
                    <span className="text-white/30">:</span>
                    <span className="text-center">{pad(countdown.hours)}</span>
                    <span className="text-white/30">:</span>
                    <span className="text-center">{pad(countdown.mins)}</span>
                    <span className="text-white/30">:</span>
                    <span className="text-center">{pad(countdown.secs)}</span>
                  </div>
                  <div className="mx-auto mt-2 grid max-w-md grid-cols-4 gap-2">
                    <span className={`text-center ${MOCKUP_CAMPUS.countdownUnit}`}>
                      {t("campus.mock.days")}
                    </span>
                    <span className={`text-center ${MOCKUP_CAMPUS.countdownUnit}`}>
                      {t("campus.mock.hrs")}
                    </span>
                    <span className={`text-center ${MOCKUP_CAMPUS.countdownUnit}`}>
                      {t("campus.mock.mins")}
                    </span>
                    <span className={`text-center ${MOCKUP_CAMPUS.countdownUnit}`}>
                      {t("campus.mock.secs")}
                    </span>
                  </div>
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
                    <div className="mb-4 flex items-center gap-3">
                      <SchoolLogo school={b.schoolA} size={44} />
                      <span className="text-[10px] font-bold text-white/25">vs</span>
                      <SchoolLogo school={b.schoolB} size={44} />
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
              <h3 className="text-xs font-bold tracking-[0.15em] uppercase mb-3">
                {t("campus.mock.aboutTitle")}
              </h3>
              <p className="text-sm text-white/55 leading-relaxed mb-4">{t("campus.mock.aboutBody")}</p>
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
