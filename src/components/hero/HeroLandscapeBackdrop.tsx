"use client";

import Image from "next/image";
import {
  heroBackdropStripHeight,
  heroDiagonalGradient,
  heroFullBleedMaskStyle,
  heroMobileVerticalGradient,
  heroOverlayContentMaskStyle,
  heroPhotoBlurBleedInsetStyle,
  heroPhotoFlatMaskStyle,
  heroPhotoSharpBandMaskStyle,
  heroPhotoStripEdgeMaskStyle,
} from "@/lib/homeHeroLayout";
import { useHomeHeroTheme } from "@/context/HomeHeroThemeContext";
import { APP_CONTENT_BOUNDARY_INSET_PX } from "@/lib/mockupLayout";
import { useHeroWaveLayout } from "@/context/HeroWaveLayoutContext";
import {
  resolveHeroBackground,
  type HeroBackgroundId,
  type HeroBackgroundScope,
} from "@/lib/heroBackgroundPresets";
import type { RgbTuple } from "@/lib/homeHeroColors";

type MaskVariant = "full" | "none";

function overlayMaskStyle(variant: MaskVariant) {
  if (variant === "none") return {};
  return heroFullBleedMaskStyle();
}

type Props = {
  rgbTuple: RgbTuple;
  overlayEnabled?: boolean;
  backgroundScope: HeroBackgroundScope;
  variant?: "home" | "compact";
  gradStartPercent?: number;
  priority?: boolean;
  className?: string;
  /** Page-fixed hero PNG — bypasses theme background id (any preset id) */
  presetOverride?: HeroBackgroundId;
  /** When false, hide photo/overlay until theme + layout measured (avoids refresh flash) */
  visualReady?: boolean;
};

const HOME_COLOR_OVERLAY_OPACITY = 0.58;
const COMPACT_COLOR_OVERLAY_OPACITY = 0.9;

function OverlayLayers({
  overlayEnabled,
  rgbTuple,
  gradStartPercent,
  maskVariant,
  variant,
}: {
  overlayEnabled: boolean;
  rgbTuple: RgbTuple;
  gradStartPercent: number;
  maskVariant: MaskVariant;
  variant: "home" | "compact";
}) {
  const maskStyle = overlayMaskStyle(maskVariant);
  const colorOpacity =
    variant === "home" ? HOME_COLOR_OVERLAY_OPACITY : COMPACT_COLOR_OVERLAY_OPACITY;
  const vignetteClass =
    variant === "home"
      ? "from-black/30 via-black/10 to-transparent lg:from-black/25 lg:via-transparent lg:to-transparent"
      : "from-black/55 via-black/15 to-transparent lg:from-black/50 lg:via-transparent lg:to-transparent";

  if (overlayEnabled) {
    return (
      <>
        <div
          className="absolute inset-0 hidden lg:block"
          style={{
            background: heroDiagonalGradient(gradStartPercent, rgbTuple),
            opacity: colorOpacity,
            ...maskStyle,
          }}
        />
        <div
          className="absolute inset-0 lg:hidden"
          style={{
            background: heroMobileVerticalGradient(rgbTuple),
            opacity: colorOpacity,
            ...maskStyle,
          }}
        />
        <div className={`absolute inset-0 bg-gradient-to-r ${vignetteClass}`} style={maskStyle} />
      </>
    );
  }

  return (
    <div
      className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-transparent"
      style={maskStyle}
    />
  );
}

function heroPhotoOffsetWrapperStyle(offsetYPx?: number) {
  if (!offsetYPx) return undefined;
  return { transform: `translateY(${offsetYPx}px)` } as const;
}

function HeroPhotoLayers({
  heroImage,
  heroImagePosition,
  offsetYPx,
  stripWidth,
  stripHeightPx,
  priority,
  topFadeBandPercent,
  flatPhoto,
}: {
  heroImage: string;
  heroImagePosition: string;
  offsetYPx?: number;
  stripWidth: string;
  stripHeightPx: number;
  priority: boolean;
  topFadeBandPercent?: number;
  flatPhoto?: boolean;
}) {
  const imageStyle = {
    objectPosition: heroImagePosition,
    ...(flatPhoto ? { transform: "scaleX(-1)" as const } : {}),
  };
  const offsetWrapperStyle = heroPhotoOffsetWrapperStyle(offsetYPx);

  if (flatPhoto) {
    return (
      <div className="absolute inset-0" style={heroPhotoFlatMaskStyle(stripHeightPx)}>
        <div className="absolute inset-0" style={offsetWrapperStyle}>
          <Image
            src={heroImage}
            alt=""
            fill
            priority={priority}
            className="object-cover"
            style={imageStyle}
            sizes={stripWidth}
          />
        </div>
      </div>
    );
  }

  const blurBleedInset = heroPhotoBlurBleedInsetStyle();

  return (
    <>
      <div
        className="absolute"
        style={{ ...blurBleedInset, ...offsetWrapperStyle }}
      >
        <Image
          src={heroImage}
          alt=""
          fill
          priority={priority}
          className="absolute inset-0 scale-[1.2] object-cover blur-[48px] lg:blur-[56px]"
          style={imageStyle}
          sizes={stripWidth}
        />
      </div>
      <div
        className="absolute inset-0"
        style={heroPhotoSharpBandMaskStyle(stripHeightPx, { topFadeBandPercent })}
      >
        <div className="absolute inset-0" style={offsetWrapperStyle}>
          <Image
            src={heroImage}
            alt=""
            fill
            priority={priority}
            className="object-cover"
            style={imageStyle}
            sizes={stripWidth}
          />
        </div>
      </div>
    </>
  );
}

export default function HeroLandscapeBackdrop({
  rgbTuple,
  overlayEnabled = true,
  backgroundScope,
  variant = "home",
  gradStartPercent = 44,
  priority = false,
  className = "",
  presetOverride,
  visualReady = true,
}: Props) {
  const { waveRect } = useHeroWaveLayout();
  const { theme } = useHomeHeroTheme();
  const themeBackgroundId =
    backgroundScope === "home" ? theme.homeBackgroundId : theme.campusBackgroundId;
  const effectiveBackgroundId = presetOverride ?? themeBackgroundId;
  const {
    src: heroImage,
    objectPosition: heroImagePosition,
    offsetYPx,
  } = resolveHeroBackground(backgroundScope, themeBackgroundId, presetOverride);

  const isHomeUnderWater = effectiveBackgroundId === "home_under_water";

  if (variant === "home") {
    const stripWidth = `calc(100% - ${waveRect.insetLeft}px - ${waveRect.insetRight}px)`;

    const backdropHeight = heroBackdropStripHeight(waveRect);

    return (
      <div
        className={`absolute z-[1] overflow-hidden pointer-events-none transition-opacity duration-0 ${className} ${
          visualReady ? "opacity-100" : "opacity-0"
        }`}
        style={{
          top: waveRect.backdropTop,
          left: waveRect.insetLeft,
          right: isHomeUnderWater ? -APP_CONTENT_BOUNDARY_INSET_PX : waveRect.insetRight,
          height: backdropHeight,
        }}
        aria-hidden
      >
        <div className="absolute inset-0" style={isHomeUnderWater ? undefined : heroPhotoStripEdgeMaskStyle(backdropHeight)}>
          <HeroPhotoLayers
            heroImage={heroImage}
            heroImagePosition={heroImagePosition}
            offsetYPx={offsetYPx}
            stripWidth={stripWidth}
            stripHeightPx={backdropHeight}
            priority={priority}
            flatPhoto={isHomeUnderWater}
          />
        </div>
        {overlayEnabled && !isHomeUnderWater ? (
          <div className="absolute inset-0" style={heroOverlayContentMaskStyle()}>
            <OverlayLayers
              overlayEnabled
              rgbTuple={rgbTuple}
              gradStartPercent={gradStartPercent}
              maskVariant="none"
              variant="home"
            />
          </div>
        ) : null}
      </div>
    );
  }

  const minH = "min-h-[220px]";
  const fullBleedMask = heroFullBleedMaskStyle();

  return (
    <div className={`absolute inset-0 z-0 pointer-events-none overflow-hidden ${minH} ${className}`} aria-hidden>
      <Image
        src={heroImage}
        alt=""
        fill
        priority={priority}
        className="object-cover"
        style={{ objectPosition: heroImagePosition }}
        sizes="100vw"
      />
      <OverlayLayers
        overlayEnabled={overlayEnabled}
        rgbTuple={rgbTuple}
        gradStartPercent={gradStartPercent}
        maskVariant="full"
        variant="compact"
      />
      <div
        className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-xiio-bg/90"
        style={fullBleedMask}
      />
    </div>
  );
}
