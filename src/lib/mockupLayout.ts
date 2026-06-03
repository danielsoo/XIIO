/** 001 home mockup full frame (1536×1024 PNG) — reference constants only */
export const MOCKUP_FRAME = { width: 1536, height: 1024 } as const;

export const MOCKUP_SIDEBAR = 239;
export const MOCKUP_CONTENT = 1297;

export const MOCKUP_CONTENT_INSET = {
  left: MOCKUP_SIDEBAR,
  width: MOCKUP_CONTENT,
  rightMargin: 76,
} as const;

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
  heroToFeaturedHeaderGap: 32,
  heroMinHeight: 428,
  heroTextColWidth: 376,
  heroColGap: 96,
  heroTitleSize: 60,
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

export function pctOfContent(mockupPx: number): number {
  return (mockupPx / MOCKUP_CONTENT) * 100;
}
