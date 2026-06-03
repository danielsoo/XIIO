import type { CSSProperties } from "react";
import { APP_SIDEBAR_WIDTH } from "@/lib/appNav";

/** 001 home mockup full frame (1536×1024 PNG) */
export const MOCKUP_FRAME = { width: 1536, height: 1024 } as const;

export const MOCKUP_CONTENT = {
  left: 239,
  width: 1297,
  padAfterSidebar: 15,
} as const;

/** Measured layout px on 001 mockup */
export const MOCKUP_MEASURES = {
  heroMinHeight: 428,
  heroTextColWidth: 376,
  heroColGap: 96,
  heroTitleSize: 48,
  heroSubtitleSize: 14,
  ctaHeight: 40,
  featuredCardWidth: 233,
  featuredCardGap: 14,
  surfaceCardWidth: 177,
  surfaceCardGap: 12,
  campusBannerWidth: 380,
  campusBannerHeight: 190,
  surfaceCampusGap: 24,
  sectionGap: 32,
  sectionTitleSize: 14,
} as const;

export const MOCKUP_SCALE_VAR = "--mockup-scale";
export const CAMPUS_WIDTH_VAR = "--campus-w";
export const SURFACE_CAMPUS_GAP_VAR = "--gap-surface-campus";

export function pctOfContent(mockupPx: number): number {
  return (mockupPx / MOCKUP_CONTENT.width) * 100;
}

export function scaledPx(mockupPx: number): string {
  return `calc(${mockupPx}px * var(${MOCKUP_SCALE_VAR}))`;
}

export const mockupShellStyle: CSSProperties = {
  [MOCKUP_SCALE_VAR as string]: `calc((100vw - ${APP_SIDEBAR_WIDTH}) / ${MOCKUP_CONTENT.width})`,
  [CAMPUS_WIDTH_VAR as string]: scaledPx(MOCKUP_MEASURES.campusBannerWidth),
  [SURFACE_CAMPUS_GAP_VAR as string]: scaledPx(MOCKUP_MEASURES.surfaceCampusGap),
};
