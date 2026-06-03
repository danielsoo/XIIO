export const MOCKUP_HOME = {
  pageShell: "w-full",
  contentMainColumnPad:
    "lg:pl-[calc(var(--app-sidebar-width)+var(--app-content-boundary-inset))]",
  contentRightMargin: "lg:pr-[var(--app-content-right-margin)]",
  contentColumnGuard: "min-w-0 max-w-full overflow-x-clip",
  topBarHeight: "h-[60px]",
  searchBar: "w-full max-w-[520px] min-w-0 h-[40px] text-[14px]",
  searchIconLeft: "left-[16px]",
  heroSection: "min-h-[280px] lg:min-h-0",
  heroInnerMinHeight: "min-h-0",
  heroContentTop: "pt-[36px] lg:pt-0",
  heroTextBottom: "pb-[40px] lg:pb-0",
  heroTextColumn: "flex flex-col justify-end px-4 lg:px-0 lg:justify-center lg:self-center",
  heroGrid:
    "lg:grid lg:items-end lg:grid-cols-[minmax(0,376px)_minmax(0,1fr)] lg:gap-[clamp(1rem,4vw,6rem)]",
  heroTitle:
    "font-serif text-[clamp(2rem,4vw,60px)] font-normal leading-[1.08] tracking-tight mb-3 max-w-full",
  heroSubtitle: "text-[15px] leading-[1.5] max-w-[376px] text-white/55 mb-7",
  ctaRow: "gap-[12px]",
  ctaButton: "h-[40px] px-6 text-[14px] rounded-full",
  featuredLabel:
    "text-[10px] font-semibold tracking-[0.2em] text-sky-400 uppercase mb-2",
  featuredTitle: "text-[18px] font-semibold text-white",
  featuredMeta: "text-[12px] text-white/45 mb-3",
  featuredPlay:
    "shrink-0 w-10 h-10 rounded-full border border-white/25 flex items-center justify-center text-white/90 hover:bg-white/10 transition",
  sectionTitle: "text-[16px]",
  sectionChevron: "w-3.5 h-3.5",
  viewAllLink: "text-xs",
  featuredHeaderToCards: "mt-3.5",
  sectionGap: "gap-8",
  featuredCardWidth: "w-full max-w-[233px] min-w-0",
  surfaceCardWidth: "w-full max-w-[177px] min-w-0",
  featuredRowWidth: "w-full max-w-[1221px]",
  selectsRowWidth: "w-full max-w-[974px]",
  featuredRowGap: "gap-[14px]",
  surfaceRowGap: "gap-3",
  campusBanner: "w-full max-w-[380px] min-w-0 min-h-[190px]",
  cardRadius: "rounded-xl",
  accentBlue: "#7EC8E3",
  accentBlueBright: "#6EB5FF",
  bg: "#05070A",
} as const;

export const HOME_IMAGE_BASE = "/images/home";
