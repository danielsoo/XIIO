"use client";

import Image from "next/image";
import {
  heroBottomFeatherMask,
  heroDiagonalGradient,
  heroMobileVerticalGradient,
} from "@/lib/homeHeroLayout";
import { HERO_LANDSCAPE_IMAGE, HERO_LANDSCAPE_POSITION } from "@/lib/homeHeroBackground";
import type { RgbTuple } from "@/lib/homeHeroColors";

const maskStyle = {
  WebkitMaskImage: heroBottomFeatherMask(),
  maskImage: heroBottomFeatherMask(),
} as const;

type Props = {
  rgbTuple: RgbTuple;
  overlayEnabled?: boolean;
  variant?: "home" | "compact";
  gradStartPercent?: number;
  priority?: boolean;
  className?: string;
};

export default function HeroLandscapeBackdrop({
  rgbTuple,
  overlayEnabled = true,
  variant = "home",
  gradStartPercent = 44,
  priority = false,
  className = "",
}: Props) {
  const minH = variant === "compact" ? "min-h-[220px]" : "";

  return (
    <div className={`absolute inset-0 z-0 pointer-events-none overflow-hidden ${minH} ${className}`} aria-hidden>
      <Image
        src={HERO_LANDSCAPE_IMAGE}
        alt=""
        fill
        priority={priority}
        className="object-cover"
        style={{ objectPosition: HERO_LANDSCAPE_POSITION }}
        sizes="(max-width: 1024px) 100vw, calc(100vw - 14rem)"
      />
      {overlayEnabled ? (
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
      ) : (
        <div
          className="absolute inset-0 bg-gradient-to-r from-black/25 via-transparent to-transparent"
          style={maskStyle}
        />
      )}
      <div
        className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-xiio-bg/90"
        style={maskStyle}
      />
    </div>
  );
}
