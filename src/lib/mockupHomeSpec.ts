import { APP_MAIN_BG } from "@/lib/mockupLayout";

export const MOCKUP_HOME = {
  pageShell: "w-full",
  contentMainColumnPad:
    "lg:pl-[calc(var(--app-sidebar-width)+var(--app-content-boundary-inset))] lg:pr-[var(--app-content-boundary-inset)]",
  contentRightPad: "",
  topBarRightPad: "lg:pr-0",
  contentColumnGuard: "min-w-0 max-w-full",
  contentBodyGuard: "min-w-0 max-w-full overflow-x-clip",
  topBarHeight: "h-[60px]",
  searchBar: "w-full max-w-[520px] min-w-0 h-[40px] text-[14px]",
  searchIconLeft: "left-[16px]",
  heroSection: "min-h-[280px] lg:min-h-0",
  heroInnerMinHeight: "min-h-0",
  heroContentTop: "pt-[36px] lg:pt-0",
  heroTextBottom: "pb-[40px] lg:pb-0",
  heroTextColumn: "flex flex-col justify-end px-4 lg:px-0 lg:justify-center lg:self-center",
  heroGrid:
    "lg:grid lg:items-end lg:grid-cols-[minmax(0,min(560px,52vw))_minmax(0,1fr)] lg:gap-[clamp(1rem,4vw,6rem)] lg:overflow-visible",
  heroTitle:
    "font-serif text-[clamp(2.25rem,4.5vw,68px)] font-normal leading-[1.12] tracking-tight mb-[clamp(0.5rem,1vw,1rem)] max-w-full",
  heroSubtitle:
    "text-[clamp(0.75rem,1.5vw,15px)] leading-[1.55] max-w-[min(100%,560px)] text-white/55 mb-[clamp(1rem,2.5vw,1.75rem)]",
  heroTextColumnWide:
    "relative z-10 min-w-0 lg:max-w-none",
  ctaRow: "gap-[clamp(0.5rem,1vw,12px)]",
  ctaButton: "h-[clamp(2rem,3.5vw,40px)] px-[clamp(0.75rem,2vw,1.5rem)] text-[clamp(0.7rem,1.2vw,14px)] rounded-full",
  featuredLabel:
    "text-[10px] font-semibold tracking-[0.2em] text-sky-400 uppercase mb-2",
  featuredTitle: "text-[18px] font-semibold text-white",
  featuredMeta: "text-[12px] text-white/45 mb-3",
  featuredPlay:
    "shrink-0 w-10 h-10 rounded-full border border-white/25 flex items-center justify-center text-white/90 hover:bg-white/10 transition",
  viewAllLink: "text-xs",
  featuredHeaderToCards: "mt-3.5",
  sectionGap: "gap-8",
  featuredCardWidth: "w-full max-w-[233px] min-w-0",
  surfaceCardWidth: "w-full min-w-0",
  surfaceMobileCardWidth: "shrink-0 w-[177px]",
  featuredRowWidth: "w-full max-w-[1221px]",
  surfaceRowWidth: "w-full max-w-[1221px]",
  selectsRowWidth: "w-full max-w-[974px]",
  featuredRowGap: "gap-[14px]",
  surfaceRowGap: "gap-[14px]",
  campusBanner: "w-full max-w-[380px] min-w-0 min-h-[190px]",
  cardRadius: "rounded-xl",
  accentBlue: "#89A5CF",
  accentBlueBright: "#6EB5FF",
  bg: APP_MAIN_BG,
} as const;

export const HOME_IMAGE_BASE = "/images/home";
