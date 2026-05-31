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
  heroBlue: "#1C4574",
  ctaBlue: "#256195",
  ctaBlueHover: "#2d6fa8",
} as const;

/** #1C4574 — alpha만 단조 감소, 뒤 검정(main)이 비침 */
const HERO_BLUE_RGB = "28, 69, 116";

export function heroPercentOfWidth(px: number): number {
  return (px / HERO_DESIGN.frameWidth) * 100;
}

export function heroDiagonalGradient(gradStartPercent: number): string {
  const flat = Math.max(0, Math.min(85, gradStartPercent));
  const mid = Math.min(100, flat + 18);
  const late = Math.min(100, flat + 32);

  return `linear-gradient(${HERO_DESIGN.gradAngleDeg}deg,
    rgba(${HERO_BLUE_RGB}, 1) 0%,
    rgba(${HERO_BLUE_RGB}, 1) ${flat}%,
    rgba(${HERO_BLUE_RGB}, 0.45) ${mid}%,
    rgba(${HERO_BLUE_RGB}, 0.12) ${late}%,
    transparent 100%)`;
}

export function heroMobileVerticalGradient(): string {
  return `linear-gradient(180deg,
    rgba(${HERO_BLUE_RGB}, 1) 0%,
    rgba(${HERO_BLUE_RGB}, 1) 45%,
    rgba(${HERO_BLUE_RGB}, 0.35) 72%,
    rgba(${HERO_BLUE_RGB}, 0.08) 88%,
    transparent 100%)`;
}

/** section inline style — 목업 비율 CSS 변수 */
export const HERO_SECTION_STYLE = {
  ["--hero-pad-x" as string]: `clamp(12px, ${heroPercentOfWidth(HERO_DESIGN.padX)}vw, 32px)`,
  ["--hero-col-gap" as string]: `clamp(40px, ${heroPercentOfWidth(HERO_DESIGN.colGap)}vw, 96px)`,
} as const;
