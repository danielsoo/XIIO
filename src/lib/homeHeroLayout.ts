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
  bottomFadePercent: 22,
  bottomFadeMinPx: 64,
  bottomFadeMaxPx: 120,
  gradAngleDeg: 118,
  gradFlatPercent: 39,
  gradDarkPercent: 72,
  heroBlue: "#1C4574",
  heroBlueDark: "#152a42",
  heroBlueDarker: "#0d1f33",
  heroBg: "#0a0a0a",
  ctaBlue: "#256195",
  ctaBlueHover: "#2d6fa8",
} as const;

export function heroPercentOfWidth(px: number): number {
  return (px / HERO_DESIGN.frameWidth) * 100;
}

export function heroDiagonalGradient(gradStartPercent: number): string {
  const start = Math.max(0, Math.min(100, gradStartPercent));
  return `linear-gradient(${HERO_DESIGN.gradAngleDeg}deg,
    ${HERO_DESIGN.heroBlue} 0%,
    ${HERO_DESIGN.heroBlue} ${start}%,
    ${HERO_DESIGN.heroBlueDark} ${start + 8}%,
    ${HERO_DESIGN.heroBlueDarker} ${HERO_DESIGN.gradDarkPercent}%,
    ${HERO_DESIGN.heroBlueDarker} 100%)`;
}

export function heroBottomFadeGradient(): string {
  return `linear-gradient(to bottom,
    transparent 0%,
    transparent 55%,
    rgba(10, 10, 10, 0.35) 78%,
    ${HERO_DESIGN.heroBg} 100%)`;
}

export function heroMobileVerticalGradient(): string {
  return `linear-gradient(180deg,
    ${HERO_DESIGN.heroBlue} 0%,
    ${HERO_DESIGN.heroBlue} 45%,
    ${HERO_DESIGN.heroBlueDarker} 72%,
    ${HERO_DESIGN.heroBlueDarker} 100%)`;
}

/** section inline style — 목업 비율 CSS 변수 */
export const HERO_SECTION_STYLE = {
  ["--hero-pad-x" as string]: `clamp(16px, ${heroPercentOfWidth(HERO_DESIGN.padX)}vw, 48px)`,
  ["--hero-col-gap" as string]: `clamp(40px, ${heroPercentOfWidth(HERO_DESIGN.colGap)}vw, 96px)`,
} as const;
