import {
  DEFAULT_HOME_HERO_THEME,
  hexToRgbTuple,
  rgbTupleToCssVar,
  type RgbTuple,
} from "@/lib/homeHeroColors";
import { framePx, MOCKUP_FRAME, MOCKUP_MEASURES } from "@/lib/mockupLayout";

/** 1536×1024 목업 기준 — mockupLayout과 동일 px */
export const HERO_DESIGN = {
  frameWidth: MOCKUP_FRAME.width,
  frameHeight: MOCKUP_FRAME.height,
  heroMinHeight: MOCKUP_MEASURES.heroMinHeight,
  textColWidth: MOCKUP_MEASURES.heroTextColWidth,
  colGap: MOCKUP_MEASURES.heroColGap,
  titleSize: MOCKUP_MEASURES.heroTitleSize,
  subtitleSize: MOCKUP_MEASURES.heroSubtitleSize,
  buttonHeight: MOCKUP_MEASURES.ctaHeight,
  gradAngleDeg: 118,
  gradFlatPercent: 39,
  gradStartOffsetPercent: 5,
  bottomFeatherStartPercent: 58,
  heroBlue: DEFAULT_HOME_HERO_THEME.heroHex,
  ctaBlue: DEFAULT_HOME_HERO_THEME.ctaHex,
  ctaBlueHover: DEFAULT_HOME_HERO_THEME.ctaHoverHex,
} as const;

export const DEFAULT_HERO_RGB: RgbTuple =
  hexToRgbTuple(DEFAULT_HOME_HERO_THEME.heroHex) ?? ([28, 69, 116] as RgbTuple);

function heroRgbCss(tuple: RgbTuple): string {
  return rgbTupleToCssVar(tuple);
}

export function heroPercentOfWidth(px: number): number {
  return (px / HERO_DESIGN.frameWidth) * 100;
}

export function heroDiagonalGradient(
  gradStartPercent: number,
  rgbTuple: RgbTuple = DEFAULT_HERO_RGB
): string {
  const flat = Math.max(0, Math.min(85, gradStartPercent));
  const mid = Math.min(100, flat + 18);
  const late = Math.min(100, flat + 32);
  const rgb = heroRgbCss(rgbTuple);

  return `linear-gradient(${HERO_DESIGN.gradAngleDeg}deg,
    rgba(${rgb}, 1) 0%,
    rgba(${rgb}, 1) ${flat}%,
    rgba(${rgb}, 0.45) ${mid}%,
    rgba(${rgb}, 0.12) ${late}%,
    transparent 100%)`;
}

export function heroMobileVerticalGradient(rgbTuple: RgbTuple = DEFAULT_HERO_RGB): string {
  const rgb = heroRgbCss(rgbTuple);
  return `linear-gradient(180deg,
    rgba(${rgb}, 1) 0%,
    rgba(${rgb}, 1) 45%,
    rgba(${rgb}, 0.35) 72%,
    rgba(${rgb}, 0.08) 88%,
    transparent 100%)`;
}

export function heroBottomFeatherMask(): string {
  const start = HERO_DESIGN.bottomFeatherStartPercent;
  return `linear-gradient(to bottom,
    #000 0%,
    #000 ${start}%,
    rgba(0, 0, 0, 0.88) 68%,
    rgba(0, 0, 0, 0.5) 82%,
    rgba(0, 0, 0, 0.18) 93%,
    transparent 100%)`;
}

/** HomePageContent legacy hero — frame-scale col gap */
export const HERO_SECTION_STYLE = {
  ["--hero-pad-x" as string]: framePx(0),
  ["--hero-col-gap" as string]: framePx(MOCKUP_MEASURES.heroColGap),
} as const;
