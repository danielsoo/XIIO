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
  /** flat 끝 → dark core까지 전환 폭 */
  gradBlendSpanPercent: 22,
  gradDarkPercent: 74,
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
  const start = Math.max(0, Math.min(85, gradStartPercent));
  const span = HERO_DESIGN.gradBlendSpanPercent;
  const s1 = start + span * 0.25;
  const s2 = start + span * 0.55;
  const s3 = start + span * 0.85;
  const s4 = Math.min(100, start + span);
  const dark = Math.min(100, Math.max(s4 + 6, HERO_DESIGN.gradDarkPercent));

  return `linear-gradient(${HERO_DESIGN.gradAngleDeg}deg,
    ${HERO_DESIGN.heroBlue} 0%,
    ${HERO_DESIGN.heroBlue} ${start}%,
    rgba(28, 69, 116, 0.88) ${s1}%,
    rgba(21, 42, 66, 0.72) ${s2}%,
    rgba(13, 31, 51, 0.85) ${s3}%,
    ${HERO_DESIGN.heroBlueDarker} ${s4}%,
    ${HERO_DESIGN.heroBlueDarker} ${dark}%,
    ${HERO_DESIGN.heroBlueDarker} 100%)`;
}

/** section 전체 높이 — 하단만 카탈로그 bg로 feather (strip 박스 없음) */
export function heroBottomFadeOverlay(): string {
  return `linear-gradient(to bottom,
    transparent 0%,
    transparent 62%,
    rgba(10, 10, 10, 0.12) 78%,
    rgba(10, 10, 10, 0.45) 90%,
    ${HERO_DESIGN.heroBg} 100%)`;
}

export function heroMobileVerticalGradient(): string {
  return `linear-gradient(180deg,
    ${HERO_DESIGN.heroBlue} 0%,
    ${HERO_DESIGN.heroBlue} 45%,
    rgba(28, 69, 116, 0.88) 55%,
    rgba(21, 42, 66, 0.72) 65%,
    rgba(13, 31, 51, 0.85) 78%,
    ${HERO_DESIGN.heroBlueDarker} 88%,
    ${HERO_DESIGN.heroBg} 100%)`;
}

/** section inline style — 목업 비율 CSS 변수 */
export const HERO_SECTION_STYLE = {
  ["--hero-pad-x" as string]: `clamp(12px, ${heroPercentOfWidth(HERO_DESIGN.padX)}vw, 32px)`,
  ["--hero-col-gap" as string]: `clamp(40px, ${heroPercentOfWidth(HERO_DESIGN.colGap)}vw, 96px)`,
} as const;
