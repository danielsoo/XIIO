"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import HeroLandscapeBackdrop from "@/components/hero/HeroLandscapeBackdrop";
import { useHomeHeroTheme } from "@/context/HomeHeroThemeContext";
import { useTranslations } from "@/context/LocaleContext";
import {
  ACTIVE_BATTLE,
  CURRENT_THEME,
  PAST_BATTLES,
  type CampusSchool,
} from "@/lib/campusMockData";

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
}: {
  school: Pick<CampusSchool, "logo" | "initials" | "color" | "name">;
  size?: number;
}) {
  return (
    <div
      className="relative shrink-0 rounded-full overflow-hidden border-2 border-white/10"
      style={{ width: size, height: size }}
    >
      <Image
        src={school.logo}
        alt={school.name}
        fill
        className="object-cover"
        sizes={`${size}px`}
        unoptimized
      />
    </div>
  );
}

function SchoolBadge({
  school,
  films,
  votes,
  align,
}: {
  school: CampusSchool;
  films: number;
  votes: string;
  align: "left" | "right";
}) {
  const [mainName, ...rest] = school.name.split(" ");
  const subName = rest.join(" ");

  return (
    <div className={`flex flex-col items-center text-center gap-3 flex-1`}>
      <SchoolLogo school={school} size={96} />
      <div>
        <p className="text-sm font-black tracking-[0.18em] text-white leading-tight">{mainName}</p>
        {subName && (
          <p className="text-[10px] font-semibold tracking-[0.15em] text-white/50 mt-0.5">{subName}</p>
        )}
      </div>
      <p className="text-[11px] text-white/40">
        {films} Films · {votes} Votes
      </p>
    </div>
  );
}

export default function CampusMockPage() {
  const { t } = useTranslations();
  const { rgbTuple, overlayEnabled, heroStyle } = useHomeHeroTheme();
  const countdown = useCountdown(ACTIVE_BATTLE.votingEndsAt);
  const { schoolA, schoolB } = ACTIVE_BATTLE;

  return (
    <main className="min-h-screen pb-16" style={heroStyle}>
      <section className="relative min-h-[320px] flex flex-col justify-end px-4 sm:px-6 lg:px-10 pb-10">
        <HeroLandscapeBackdrop rgbTuple={rgbTuple} overlayEnabled={overlayEnabled} variant="compact" />
        <div className="relative z-10 max-w-3xl">
          <p className="text-xs font-bold tracking-[0.25em] text-sky-400 mb-3">{t("campus.mock.badge")}</p>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white mb-3">
            {t("campus.mock.title")}
          </h1>
          <p className="text-white/55 text-sm sm:text-base max-w-xl mb-6">{t("campus.mock.subtitle")}</p>
          <Link
            href="/about#campus"
            className="inline-flex items-center gap-2 rounded-full border border-white/30 px-5 py-2 text-sm text-white hover:bg-white/10 transition"
          >
            <span aria-hidden>▶</span>
            {t("campus.mock.howItWorks")}
          </Link>
        </div>
      </section>

      <div className="px-4 sm:px-6 lg:px-10 space-y-12">
        {/* Active Battles */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
              <h2 className="text-xs font-bold tracking-[0.2em] uppercase">{t("campus.mock.activeBattles")}</h2>
            </div>
            <Link href="/school-battle" className="text-xs text-white/45 hover:text-white">
              {t("campus.mock.viewAllBattles")} →
            </Link>
          </div>

          <div className="grid lg:grid-cols-[1fr_280px] gap-4">
            {/* Battle card */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
              <div className="flex items-center justify-between gap-4 mb-8">
                <SchoolBadge school={schoolA} films={schoolA.films} votes={schoolA.votes} align="left" />
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <span className="text-xl font-black text-white/25 italic tracking-widest">VS</span>
                </div>
                <SchoolBadge school={schoolB} films={schoolB.films} votes={schoolB.votes} align="right" />
              </div>

              <div className="text-center border-t border-white/10 pt-6">
                <p className="text-[10px] tracking-[0.2em] text-white/40 mb-3 uppercase">
                  {t("campus.mock.votingEnds")}
                </p>
                <div className="flex justify-center gap-3 sm:gap-6 font-mono text-2xl sm:text-3xl text-white tabular-nums">
                  <span>{pad(countdown.days)}</span>
                  <span className="text-white/30">:</span>
                  <span>{pad(countdown.hours)}</span>
                  <span className="text-white/30">:</span>
                  <span>{pad(countdown.mins)}</span>
                  <span className="text-white/30">:</span>
                  <span>{pad(countdown.secs)}</span>
                </div>
                <div className="flex justify-center gap-6 sm:gap-12 text-[9px] uppercase tracking-wider text-white/35 mt-2">
                  <span>{t("campus.mock.days")}</span>
                  <span>{t("campus.mock.hrs")}</span>
                  <span>{t("campus.mock.mins")}</span>
                  <span>{t("campus.mock.secs")}</span>
                </div>
              </div>
            </div>

            {/* Current theme card */}
            <div className={`rounded-2xl border border-white/10 overflow-hidden bg-gradient-to-br ${CURRENT_THEME.gradient} p-5 flex flex-col min-h-[280px]`}>
              <p className="text-[10px] font-bold tracking-[0.2em] text-sky-300 uppercase mb-1">
                {t("campus.mock.currentTheme")}
              </p>
              <h3 className="text-lg font-bold text-white mb-3">{CURRENT_THEME.title}</h3>
              <p className="text-sm text-white/60 flex-1">{CURRENT_THEME.description}</p>
              <button
                type="button"
                className="mt-4 inline-flex items-center gap-1 text-sm text-sky-300 hover:text-sky-200"
              >
                {t("campus.mock.viewBrief")} ↗
              </button>
            </div>
          </div>
        </section>

        {/* Past Battles */}
        <section>
          <div className="flex items-center gap-2 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
            <h2 className="text-xs font-bold tracking-[0.2em] uppercase">{t("campus.mock.pastBattles")}</h2>
          </div>

          <div className="grid lg:grid-cols-[1fr_300px] gap-4">
            <div className="grid sm:grid-cols-3 gap-3">
              {PAST_BATTLES.map((b) => (
                <div
                  key={b.id}
                  className="rounded-xl border border-white/10 bg-white/[0.03] p-4 flex flex-col items-center text-center"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <SchoolLogo school={b.schoolA} size={44} />
                    <span className="text-white/25 text-[10px] font-bold">vs</span>
                    <SchoolLogo school={b.schoolB} size={44} />
                  </div>
                  <p className="text-xs font-semibold text-white/70 mb-1">
                    {b.schoolA.name} vs {b.schoolB.name}
                  </p>
                  <p className="text-[11px] text-sky-400">{t("campus.mock.winner")} {b.winner}</p>
                  <p className="text-[11px] text-white/40 mt-1">{b.votes} {t("campus.mock.votes")}</p>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h3 className="text-xs font-bold tracking-[0.15em] uppercase mb-3">{t("campus.mock.aboutTitle")}</h3>
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
