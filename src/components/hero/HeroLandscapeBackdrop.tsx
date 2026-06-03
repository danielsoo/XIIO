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

function OverlayLayers({
  overlayEnabled,
  rgbTuple,
  gradStartPercent,
  maskVariant,
}: {
  overlayEnabled: boolean;
  rgbTuple: RgbTuple;
  gradStartPercent: number;
  maskVariant: MaskVariant;
}) {
  const maskStyle = overlayMaskStyle(maskVariant);

  if (overlayEnabled) {
    return (
      <>
        <div
          className="absolute inset-0 hidden lg:block"
          style={{
            background: heroDiagonalGradient(gradStartPercent, rgbTuple),
            opacity: 0.9,
            ...maskStyle,
          }}
        />
        <div
          className="absolute inset-0 lg:hidden"
          style={{
            background: heroMobileVerticalGradient(rgbTuple),
            opacity: 0.9,
            ...maskStyle,
          }}
        />
        <div
          className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/15 to-transparent lg:from-black/50 lg:via-transparent lg:to-transparent"
          style={maskStyle}
        />
      </>
    );
  }

  return (
    <div
      className="absolute inset-0 bg-gradient-to-r from-black/25 via-transparent to-transparent"
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
    return (
      <div
        className={`fixed z-0 overflow-hidden pointer-events-none ${className}`}
        style={{
          top: waveRect.top,
          left: waveRect.left,
          right: waveRect.right,
          height: waveRect.height,
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
          sizes={`calc(100vw - ${Math.round(waveRect.left)}px - ${Math.round(waveRect.right)}px)`}
        />
        <OverlayLayers
          overlayEnabled={overlayEnabled}
          rgbTuple={rgbTuple}
          gradStartPercent={gradStartPercent}
          maskVariant="none"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-transparent to-transparent pointer-events-none" />
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
      />
      <div
        className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-xiio-bg/90"
        style={fullBleedMask}
      />
    </div>
  );
}
