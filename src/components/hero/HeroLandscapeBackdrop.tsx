"use client";

import Image from "next/image";
import {
  heroDiagonalGradient,
  heroFullBleedMaskStyle,
  heroMobileVerticalGradient,
} from "@/lib/homeHeroLayout";
import { HERO_LANDSCAPE_IMAGE, HERO_LANDSCAPE_POSITION } from "@/lib/homeHeroBackground";
import type { RgbTuple } from "@/lib/homeHeroColors";
import { useHeroWaveLayout } from "@/context/HeroWaveLayoutContext";

type MaskVariant = "full" | "none";

function overlayMaskStyle(variant: MaskVariant) {
  if (variant === "none") return {};
  return heroFullBleedMaskStyle();
}

type Props = {
  rgbTuple: RgbTuple;
  overlayEnabled?: boolean;
  variant?: "home" | "compact";
  gradStartPercent?: number;
  priority?: boolean;
  className?: string;
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

export default function HeroLandscapeBackdrop({
  rgbTuple,
  overlayEnabled = true,
  variant = "home",
  gradStartPercent = 44,
  priority = false,
  className = "",
}: Props) {
  const { waveRect } = useHeroWaveLayout();

  if (variant === "home") {
    const stripWidth = `calc(100% - ${waveRect.insetLeft}px - ${waveRect.insetRight}px)`;

    return (
      <div
        className={`absolute top-0 bottom-0 z-[1] overflow-hidden pointer-events-none ${className}`}
        style={{
          left: waveRect.insetLeft,
          right: waveRect.insetRight,
        }}
        aria-hidden
      >
        <Image
          src={HERO_LANDSCAPE_IMAGE}
          alt=""
          fill
          priority={priority}
          className="object-cover"
          style={{ objectPosition: HERO_LANDSCAPE_POSITION }}
          sizes={stripWidth}
        />
        <OverlayLayers
          overlayEnabled={overlayEnabled}
          rgbTuple={rgbTuple}
          gradStartPercent={gradStartPercent}
          maskVariant="none"
          variant="home"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/20 pointer-events-none" />
      </div>
    );
  }

  const minH = "min-h-[220px]";
  const fullBleedMask = heroFullBleedMaskStyle();

  return (
    <div className={`absolute inset-0 z-0 pointer-events-none overflow-hidden ${minH} ${className}`} aria-hidden>
      <Image
        src={HERO_LANDSCAPE_IMAGE}
        alt=""
        fill
        priority={priority}
        className="object-cover"
        style={{ objectPosition: HERO_LANDSCAPE_POSITION }}
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
