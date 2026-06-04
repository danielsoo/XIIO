/** 001 home mockup full frame (1536×1024 PNG) — reference constants only */
export const MOCKUP_FRAME = { width: 1536, height: 1024 } as const;

export const MOCKUP_SIDEBAR = 239;
export const MOCKUP_CONTENT = 1297;

export const MOCKUP_CONTENT_INSET = {
  left: MOCKUP_SIDEBAR,
  width: MOCKUP_CONTENT,
  rightMargin: 76,
} as const;

/** Implemented sidebar width (12rem) — gap after border-r to main content start */
export const APP_SIDEBAR_IMPLEMENTATION_PX = 192;
export const APP_CONTENT_BOUNDARY_INSET_PX =
  MOCKUP_CONTENT_INSET.left - APP_SIDEBAR_IMPLEMENTATION_PX;
export const APP_CONTENT_RIGHT_MARGIN_PX = MOCKUP_CONTENT_INSET.rightMargin;

/** App chrome — sidebar vs main column (photos excluded) */
export const APP_SIDEBAR_BG = "#02070B";
export const APP_MAIN_BG = "#020408";

/** Measured layout px on 001 mockup */
export const MOCKUP_MEASURES = {
  topBarHeight: 60,
  searchBarWidth: 520,
  searchBarHeight: 40,
  searchIconLeft: 16,
  searchFontSize: 14,
  heroBandHeight: 428,
  heroContentPaddingTop: 36,
  heroTextPaddingBottom: 40,
  /** lg: wave strip starts below top bar area */
  heroBackdropTopOffsetLg: 24,
  /** lg: wave extends below My List band into content area */
  heroBackdropExtendBottomLg: 48,
  /** lg: photo strip edge feather into page background (all 5 hero backgrounds) */
  heroStripFeatherLeftPx: 112,
  heroStripFeatherRightPx: 96,
  /** bottom fade zone height as % of strip (multi-stop to transparent) */
  heroStripFeatherBottomFadePercent: 22,
  /** blur layer extends past clip box for edge tone */
  heroPhotoBlurBleedPx: 24,
  heroToFeaturedHeaderGap: 32,
  heroMinHeight: 428,
  heroTextColWidth: 376,
  heroColGap: 96,
  heroTitleSize: 68,
  heroTitleToSubtitleGap: 16,
  heroSubtitleSize: 15,
  featuredStoryTitleSize: 18,
  ctaHeight: 40,
  ctaPaddingX: 24,
  ctaGap: 12,
  ctaFontSize: 14,
  viewAllFontSize: 12,
  sectionChevronSize: 14,
  featuredHeaderToCardsGap: 14,
  featuredCardWidth: 233,
  featuredCardHeight: 134,
  featuredCardGap: 14,
  featuredRowWidth: 1221,
  selectsRowWidth: 974,
  surfaceCardWidth: 177,
  surfaceCardHeight: 111,
  surfaceCardGap: 12,
  surfaceRowWidth: 744,
  campusBannerWidth: 380,
  campusBannerHeight: 190,
  surfaceCampusGap: 24,
  sectionGap: 32,
  sectionTitleSize: 16,
} as const;

/** Measured on 002 campus mockup */
export const MOCKUP_CAMPUS_MEASURES = {
  themeCardWidth: 280,
  battleCardMinHeight: 220,
  brandWashOpacity: 0.55,
  clashGlowOpacityCompact: 0.35,
  brandLogoOpacityActive: 0.18,
  brandLogoOpacityCompact: 0.26,
} as const;

export function pctOfContent(mockupPx: number): number {
  return (mockupPx / MOCKUP_CONTENT) * 100;
}
