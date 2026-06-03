import type { CSSProperties } from "react";
import { framePx, MOCKUP_CONTENT_INSET, MOCKUP_MEASURES } from "@/lib/mockupLayout";

export const MOCKUP_HOME = {
  pageShell: "w-full",
  cardRadius: "rounded-xl",
  accentBlue: "#7EC8E3",
  accentBlueBright: "#6EB5FF",
  bg: "#05070A",
} as const;

export const MOCKUP_HOME_STYLES = {
  topBarHeight: { height: framePx(MOCKUP_MEASURES.topBarHeight) } satisfies CSSProperties,
  contentRightPad: { paddingRight: framePx(MOCKUP_CONTENT_INSET.rightMargin) } satisfies CSSProperties,
  heroMinHeight: { minHeight: framePx(MOCKUP_MEASURES.heroMinHeight) } satisfies CSSProperties,
  heroGrid: {
    gridTemplateColumns: `${framePx(MOCKUP_MEASURES.heroTextColWidth)} 1fr`,
    gap: framePx(MOCKUP_MEASURES.heroColGap),
  } satisfies CSSProperties,
  heroTitle: { fontSize: framePx(MOCKUP_MEASURES.heroTitleSize) } satisfies CSSProperties,
  heroSubtitle: { fontSize: framePx(MOCKUP_MEASURES.heroSubtitleSize) } satisfies CSSProperties,
  ctaButton: { height: framePx(MOCKUP_MEASURES.ctaHeight) } satisfies CSSProperties,
  sectionTitle: { fontSize: framePx(MOCKUP_MEASURES.sectionTitleSize) } satisfies CSSProperties,
  sectionGap: { gap: framePx(MOCKUP_MEASURES.sectionGap) } satisfies CSSProperties,
  featuredCardWidth: { width: framePx(MOCKUP_MEASURES.featuredCardWidth) } satisfies CSSProperties,
  surfaceCardWidth: { width: framePx(MOCKUP_MEASURES.surfaceCardWidth) } satisfies CSSProperties,
  featuredRowWidth: { width: framePx(MOCKUP_MEASURES.featuredRowWidth) } satisfies CSSProperties,
  selectsRowWidth: { width: framePx(MOCKUP_MEASURES.selectsRowWidth) } satisfies CSSProperties,
  featuredRowGap: { gap: framePx(MOCKUP_MEASURES.featuredCardGap) } satisfies CSSProperties,
  surfaceRowGap: { gap: framePx(MOCKUP_MEASURES.surfaceCardGap) } satisfies CSSProperties,
  campusBannerWidth: { width: framePx(MOCKUP_MEASURES.campusBannerWidth) } satisfies CSSProperties,
  campusBannerMinH: { minHeight: framePx(MOCKUP_MEASURES.campusBannerHeight) } satisfies CSSProperties,
  featuredPanelLabel: { fontSize: framePx(10) } satisfies CSSProperties,
  featuredPanelTitle: { fontSize: framePx(14) } satisfies CSSProperties,
  featuredPanelMeta: { fontSize: framePx(12) } satisfies CSSProperties,
  featuredPanelPlay: { width: framePx(40), height: framePx(40) } satisfies CSSProperties,
} as const;

export const HOME_IMAGE_BASE = "/images/home";
