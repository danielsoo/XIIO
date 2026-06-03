"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import HeroLandscapeBackdrop from "@/components/hero/HeroLandscapeBackdrop";
import { useHomeHeroTheme } from "@/context/HomeHeroThemeContext";
import { useTranslations } from "@/context/LocaleContext";
import {
  ACTIVE_BATTLE,
  CURRENT_THEME,
  PAST_BATTLES,
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

function SchoolBadge({
  name,
  initials,
  color,
  films,
  votes,
  align,
}: {
  name: string;
  initials: string;
  color: string;
  films: number;
  votes: string;
  align: "left" | "right";
}) {
  return (
    <div className={`flex flex-col ${align === "right" ? "items-end text-right" : "items-start"}`}>
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center text-lg font-black text-white mb-3 border-2 border-white/20"
        style={{ backgroundColor: color }}
      >
        {initials}
      </div>
      <p className="text-[10px] font-bold tracking-wider text-white/80 max-w-[140px]">{name}</p>
      <p className="text-xs text-white/45 mt-2">
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
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4 mb-8">
                <SchoolBadge
                  name={schoolA.name}
                  initials={schoolA.initials}
                  color={schoolA.color}
                  films={schoolA.films}
                  votes={schoolA.votes}
                  align="left"
                />
                <div className="pt-6 text-2xl font-black text-white/30 italic">VS</div>
                <SchoolBadge
                  name={schoolB.name}
                  initials={schoolB.initials}
                  color={schoolB.color}
                  films={schoolB.films}
                  votes={schoolB.votes}
                  align="right"
                />
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
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className="w-10 h-10 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                      style={{ backgroundColor: b.schoolA.color }}
                    >
                      {b.schoolA.initials}
                    </span>
                    <span className="text-white/30 text-xs">vs</span>
                    <span
                      className="w-10 h-10 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                      style={{ backgroundColor: b.schoolB.color }}
                    >
                      {b.schoolB.initials}
                    </span>
                  </div>
                  <p className="text-xs text-white/70 mb-1">
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
