/** Campus (002) mockup — page-specific tokens; shared shell from MOCKUP_HOME */
export const MOCKUP_CAMPUS = {
  heroBadge: "text-xs font-bold tracking-[0.25em] text-sky-400 mb-3",
  heroTitle: "text-[48px] sm:text-[52px] font-black tracking-tight text-white uppercase leading-[1.05] mb-3",
  heroSubtitle: "text-[15px] leading-[1.5] max-w-[376px] text-white/55 mb-7",
  sectionLabel: "text-xs font-bold tracking-[0.2em] uppercase text-white",
  sectionDot: "w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0",
  sectionHeaderRow: "flex items-center justify-between mb-5",
  sectionLabelRow: "flex items-center gap-2",
  battleCard:
    "relative overflow-hidden rounded-2xl border border-white/10 bg-xiio-bg/40 min-h-[220px] p-4 sm:p-5 flex flex-col",
  vsBadge:
    "flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-white/20 bg-black/20",
  vsText: "text-lg font-black italic tracking-widest text-white/30",
  countdownLabel: "text-[10px] tracking-[0.2em] text-white/40 mb-3 uppercase",
  activeCountdownLabel: "text-[9px] tracking-[0.2em] text-white/40 mb-1 uppercase",
  countdownDigits: "font-mono text-2xl sm:text-3xl text-white tabular-nums",
  activeCountdownDigits: "font-mono text-lg sm:text-xl text-white tabular-nums",
  countdownUnit: "text-[9px] uppercase tracking-wider text-white/35",
  themeCard: "relative overflow-hidden rounded-2xl border border-white/10 min-h-0 flex flex-col",
  themeCardInner: "relative z-10 flex flex-1 flex-col p-4",
  pastCard:
    "relative overflow-hidden rounded-xl border border-white/10 bg-xiio-bg/40 p-4 flex flex-col min-h-[200px]",
  pastCardInner: "relative z-10 flex w-full flex-1 flex-col",
  pastMatchupTitle: "text-sm font-bold text-white mb-3",
  pastCardFooter: "flex w-full items-end justify-between gap-2 mt-auto",
  pastWinnerLabel: "text-[11px] text-white/40",
  pastWinnerName: "text-[11px] text-white ml-1",
  pastVotesText: "text-[11px] text-white/40 tabular-nums shrink-0",
  aboutCard: "rounded-2xl border border-white/10 bg-white/[0.03] p-4",
  schoolLogoActive: "w-24 h-24",
  schoolLogoPast: "w-[104px] h-[104px]",
  schoolNameMain: "text-sm font-black tracking-[0.18em] text-white leading-tight",
  schoolNameSub: "text-[10px] font-semibold tracking-[0.15em] text-sky-400 mt-0.5",
  activeSchoolNameMain:
    "text-base sm:text-lg font-black tracking-[0.18em] text-white leading-tight",
  activeSchoolNameSub:
    "text-[11px] sm:text-xs font-semibold tracking-[0.15em] text-sky-400 mt-0.5",
  schoolStats: "text-[11px] text-white/40",
  activeSchoolRow: "flex items-center gap-5 sm:gap-6",
  activeBattleHero:
    "flex shrink-0 items-center justify-center gap-3 sm:gap-5 min-h-[120px] sm:min-h-[140px] py-2 sm:py-3",
  activeBattleFooter:
    "grid grid-cols-[1fr_auto_1fr] items-end gap-2 border-t border-white/10 pt-3 shrink-0",
  activeBattleFooterStats: "text-[11px] text-white/40",
  activeGrid: "grid lg:grid-cols-[1fr_280px] gap-4 lg:items-start",
  pastGrid: "grid lg:grid-cols-[1fr_300px] gap-4 lg:items-start",
  pastCardsGrid: "grid sm:grid-cols-3 gap-3",
  brandLogoActiveFrame: "max-h-[180px] max-w-[220px] w-full aspect-square",
  brandLogoCompactFrame: "max-h-[112px] max-w-[140px] w-full aspect-square",
} as const;
