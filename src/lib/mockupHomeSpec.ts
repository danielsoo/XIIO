import type { CSSProperties } from "react";
import { MOCKUP_MEASURES, scaledPx } from "@/lib/mockupLayout";

export const MOCKUP_HOME = {
  contentPadX: "px-[15px]",
  pageShell: "w-full",
  cardRadius: "rounded-xl",
  accentBlue: "#7EC8E3",
  accentBlueBright: "#6EB5FF",
  bg: "#05070A",
} as const;

export const MOCKUP_HOME_STYLES = {
  heroMinHeight: { minHeight: scaledPx(MOCKUP_MEASURES.heroMinHeight) } satisfies CSSProperties,
  heroGrid: {
    gridTemplateColumns: `minmax(0, ${scaledPx(MOCKUP_MEASURES.heroTextColWidth)}) 1fr`,
    gap: scaledPx(MOCKUP_MEASURES.heroColGap),
  } satisfies CSSProperties,
  heroTitle: { fontSize: scaledPx(MOCKUP_MEASURES.heroTitleSize) } satisfies CSSProperties,
  heroSubtitle: { fontSize: scaledPx(MOCKUP_MEASURES.heroSubtitleSize) } satisfies CSSProperties,
  sectionTitle: { fontSize: scaledPx(MOCKUP_MEASURES.sectionTitleSize) } satisfies CSSProperties,
  sectionGap: { gap: scaledPx(MOCKUP_MEASURES.sectionGap) } satisfies CSSProperties,
  featuredCardWidth: { width: scaledPx(MOCKUP_MEASURES.featuredCardWidth) } satisfies CSSProperties,
  surfaceCardWidth: { width: scaledPx(MOCKUP_MEASURES.surfaceCardWidth) } satisfies CSSProperties,
  featuredRowGap: { gap: scaledPx(MOCKUP_MEASURES.featuredCardGap) } satisfies CSSProperties,
  surfaceRowGap: { gap: scaledPx(MOCKUP_MEASURES.surfaceCardGap) } satisfies CSSProperties,
  campusBannerWidth: { width: scaledPx(MOCKUP_MEASURES.campusBannerWidth) } satisfies CSSProperties,
  campusBannerMinH: { minHeight: scaledPx(MOCKUP_MEASURES.campusBannerHeight) } satisfies CSSProperties,
} as const;

export const HOME_IMAGE_BASE = "/images/home";
