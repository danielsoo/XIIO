"use client";

import { MOCKUP_CAMPUS } from "@/lib/mockupCampusSpec";

export default function BattleVsRadar() {
  return (
    <div className="relative flex h-[72px] w-[72px] shrink-0 items-center justify-center sm:h-[88px] sm:w-[88px]">
      <svg
        className="absolute inset-0 h-full w-full text-white/15"
        viewBox="0 0 88 88"
        fill="none"
        aria-hidden
      >
        <circle cx="44" cy="44" r="40" stroke="currentColor" strokeWidth="0.75" />
        <circle cx="44" cy="44" r="28" stroke="currentColor" strokeWidth="0.75" />
        <circle cx="44" cy="44" r="16" stroke="currentColor" strokeWidth="0.75" />
        <line x1="44" y1="4" x2="44" y2="84" stroke="currentColor" strokeWidth="0.5" />
        <line x1="4" y1="44" x2="84" y2="44" stroke="currentColor" strokeWidth="0.5" />
        <line x1="12" y1="12" x2="76" y2="76" stroke="currentColor" strokeWidth="0.35" />
        <line x1="76" y1="12" x2="12" y2="76" stroke="currentColor" strokeWidth="0.35" />
      </svg>
      <div className={MOCKUP_CAMPUS.vsBadge}>
        <span className={MOCKUP_CAMPUS.vsText}>VS</span>
      </div>
    </div>
  );
}
