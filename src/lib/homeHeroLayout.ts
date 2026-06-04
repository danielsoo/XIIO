import {
  DEFAULT_HOME_HERO_THEME,
  hexToRgbTuple,
  rgbTupleToCssVar,
  type RgbTuple,
} from "@/lib/homeHeroColors";
import { MOCKUP_FRAME, MOCKUP_MEASURES } from "@/lib/mockupLayout";
import type { HeroWaveRect } from "@/context/HeroWaveLayoutContext";

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

/** Photo strip height — extends behind TopBar; not a crop mask */
export function heroBackdropStripHeight(waveRect: HeroWaveRect): number {
  return (
    waveRect.height + MOCKUP_MEASURES.topBarHeight + waveRect.backdropExtendBottom
  );
}

/** Text/hero grid band — unchanged band below header */
export function heroTextBandMinHeight(waveRect: HeroWaveRect): number {
  return (
    waveRect.height -
    MOCKUP_MEASURES.heroBackdropTopOffsetLg +
    waveRect.backdropExtendBottom
  );
}

export function heroTextBandMarginTop(): number {
  return MOCKUP_MEASURES.heroBackdropTopOffsetLg - MOCKUP_MEASURES.topBarHeight;
}

export function heroSectionMinHeight(waveRect: HeroWaveRect): number {
  return (
    heroTextBandMinHeight(waveRect) +
    MOCKUP_MEASURES.topBarHeight -
    MOCKUP_MEASURES.heroBackdropTopOffsetLg
  );
}

/** Theme HEX overlay — hero text band only (not header bleed) */
export function heroOverlayContentMaskStyle() {
  return maskStyleFromImage(
    `linear-gradient(to bottom,
      transparent 0%,
      transparent 22%,
      black 35%,
      black 100%)`
  );
}

function maskStopPercent(px: number, stripHeightPx: number): number {
  if (stripHeightPx <= 0) return 0;
  return Math.min(100, Math.max(0, (px / stripHeightPx) * 100));
}

/** lg reference backdrop height when wave band ≈ heroMinHeight */
export const HERO_REFERENCE_BACKDROP_STRIP_PX =
  MOCKUP_MEASURES.heroMinHeight +
  MOCKUP_MEASURES.topBarHeight +
  MOCKUP_MEASURES.heroBackdropExtendBottomLg;

/** Top blur→sharp fade band height in px (matches heroPhotoSharpBandMaskStyle ramp end) */
export function heroPhotoTopFadeBandPx(
  stripHeightPx: number = HERO_REFERENCE_BACKDROP_STRIP_PX,
  topFadeBandPercent: number = MOCKUP_MEASURES.heroPhotoTopFadeBandPercent
): number {
  return (
    MOCKUP_MEASURES.topBarHeight +
    MOCKUP_MEASURES.heroBackdropTopOffsetLg +
    stripHeightPx * topFadeBandPercent
  );
}

/** Underwater — sharp photo only; bottom fade matches strip edge mask */
export function heroPhotoFlatMaskStyle(stripHeightPx: number) {
  const sharpFadeStartPx = stripHeightPx * 0.82;
  const sharpFade = maskStopPercent(sharpFadeStartPx, stripHeightPx);

  return maskStyleFromImage(
    `linear-gradient(to bottom,
      black 0%,
      black ${sharpFade}%,
      transparent 100%)`
  );
}

/** Sharp band — blur bleed ends at top bar + lg content offset (px), not % of strip */
export function heroPhotoSharpBandMaskStyle(
  stripHeightPx: number,
  options?: { topFadeBandPercent?: number }
) {
  const topFadeBand =
    options?.topFadeBandPercent ?? MOCKUP_MEASURES.heroPhotoTopFadeBandPercent;
  const sharpFadeStartPx = stripHeightPx * 0.82;
  const sharpFade = maskStopPercent(sharpFadeStartPx, stripHeightPx);

  const sharpBleedEndPx =
    MOCKUP_MEASURES.topBarHeight + MOCKUP_MEASURES.heroBackdropTopOffsetLg;
  const sharpFullStartPx = sharpBleedEndPx + stripHeightPx * topFadeBand;

  const blurEnd = maskStopPercent(sharpBleedEndPx, stripHeightPx);
  const sharpFull = maskStopPercent(sharpFullStartPx, stripHeightPx);
  const rampSpan = Math.max(0, sharpFull - blurEnd);
  const sharpMid1 = blurEnd + rampSpan * 0.35;
  const sharpMid2 = blurEnd + rampSpan * 0.7;

  return maskStyleFromImage(
    `linear-gradient(to bottom,
      transparent 0%,
      transparent ${blurEnd}%,
      rgba(0, 0, 0, 0.25) ${sharpMid1}%,
      rgba(0, 0, 0, 0.55) ${sharpMid2}%,
      black ${sharpFull}%,
      black ${sharpFade}%,
      transparent 100%)`
  );
}

/** Multi-stop horizontal feather (heroBottomFeatherMask-style) */
function heroStripHorizontalFeatherGradient(
  direction: "to right" | "to left",
  featherPx: number
): string {
  const w = featherPx;
  const a = (f: number) => `${Math.round(w * f)}px`;
  return `linear-gradient(${direction},
    transparent 0,
    rgba(0, 0, 0, 0.18) ${a(0.25)},
    rgba(0, 0, 0, 0.5) ${a(0.5)},
    rgba(0, 0, 0, 0.88) ${a(0.75)},
    black ${w}px)`;
}

/** Bottom feather for photo strip — last N% of height fades to transparent */
function heroStripBottomFeatherGradient(): string {
  const fade = MOCKUP_MEASURES.heroStripFeatherBottomFadePercent;
  const solidEnd = 100 - fade;
  const step = fade / 4;
  return `linear-gradient(to bottom,
    black 0%,
    black ${solidEnd}%,
    rgba(0, 0, 0, 0.88) ${solidEnd + step}%,
    rgba(0, 0, 0, 0.5) ${solidEnd + step * 2}%,
    rgba(0, 0, 0, 0.18) ${solidEnd + step * 3}%,
    transparent 100%)`;
}

/** lg home/campus photo strip — multi-stop edge feather (not top) */
export function heroPhotoStripEdgeMaskStyle(_stripHeightPx: number) {
  const left = MOCKUP_MEASURES.heroStripFeatherLeftPx;
  const right = MOCKUP_MEASURES.heroStripFeatherRightPx;

  const maskImage = `${heroStripHorizontalFeatherGradient("to right", left)}, ${heroStripHorizontalFeatherGradient("to left", right)}, ${heroStripBottomFeatherGradient()}`;

  return {
    ...maskStyleFromImage(maskImage),
    maskComposite: "intersect",
    WebkitMaskComposite: "source-in",
  } as const;
}

/** Blur layer wrapper — extends past clip for edge bleed */
export function heroPhotoBlurBleedInsetStyle(): {
  top: number;
  right: number;
  bottom: number;
  left: number;
} {
  const bleed = MOCKUP_MEASURES.heroPhotoBlurBleedPx;
  return { top: -bleed, right: -bleed, bottom: -bleed, left: -bleed };
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

/** Home wave box — no vertical fade; box bottom is the designed edge (My List) */
export function heroWaveBoxBottomMask(): string {
  return "linear-gradient(to bottom, #000 0%, #000 100%)";
}

function maskStyleFromImage(maskImage: string) {
  return {
    WebkitMaskImage: maskImage,
    maskImage,
    WebkitMaskSize: "100% 100%",
    maskSize: "100% 100%",
  } as const;
}

export function heroFullBleedMaskStyle() {
  return maskStyleFromImage(heroBottomFeatherMask());
}

export function heroWaveBoxMaskStyle() {
  return maskStyleFromImage(heroWaveBoxBottomMask());
}

/** HomePageContent legacy hero */
export const HERO_SECTION_STYLE = {
  ["--hero-pad-x" as string]: "0px",
  ["--hero-col-gap" as string]: "96px",
} as const;
