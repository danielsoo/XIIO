import {
  DEFAULT_HOME_HERO_THEME,
  hexToRgbTuple,
  rgbTupleToCssVar,
  type RgbTuple,
} from "@/lib/homeHeroColors";

/** 1024×712 목업 기준 픽셀 — clamp/% 변환용 */
export const HERO_DESIGN = {
  frameWidth: 1024,
  frameHeight: 712,
  heroMinHeight: 426,
  padX: 24,
  textColWidth: 376,
  colGap: 96,
  titleSize: 36,
  subtitleSize: 12,
  buttonHeight: 40,
  gradAngleDeg: 118,
  gradFlatPercent: 39,
  /** flat zone을 텍스트 끝보다 조금 더 오른쪽까지 확장 */
  gradStartOffsetPercent: 5,
  /** mask feather — 이 % 위까지 파랑 레이어 fully visible */
  bottomFeatherStartPercent: 52,
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

/** 하단 feather — mask alpha 1→0 (검정 덧칠 아님, main 검정 비침) */
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

/** section inline style — 목업 비율 CSS 변수 */
export const HERO_SECTION_STYLE = {
  ["--hero-pad-x" as string]: `clamp(12px, ${heroPercentOfWidth(HERO_DESIGN.padX)}vw, 32px)`,
  ["--hero-col-gap" as string]: `clamp(40px, ${heroPercentOfWidth(HERO_DESIGN.colGap)}vw, 96px)`,
} as const;
