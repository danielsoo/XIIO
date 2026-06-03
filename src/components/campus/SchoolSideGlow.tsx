"use client";

import type { BrandEffect } from "@/lib/campusBrandEffects";
import { rgba } from "@/lib/campusBrandColors";
import { MOCKUP_CAMPUS_MEASURES } from "@/lib/mockupLayout";

type Props = {
  side: "left" | "right";
  colorPrimary: string;
  colorSecondary: string;
  effect: BrandEffect;
  intensity?: "active" | "compact";
};

export default function SchoolSideGlow({
  side,
  colorPrimary,
  colorSecondary,
  effect,
  intensity = "active",
}: Props) {
  const compact = intensity === "compact";
  const blurLg = compact ? 32 : 64;
  const blurMd = compact ? 24 : 48;
  const baseOpacity = compact ? 0.45 : 1;
  const align = side === "left" ? "left" : "right";
  const origin = side === "left" ? "0% 50%" : "100% 50%";

  const primaryA = rgba(colorPrimary, 0.42 * baseOpacity);
  const secondaryA = rgba(colorSecondary, 0.28 * baseOpacity);
  const primaryB = rgba(colorPrimary, 0.32 * baseOpacity);

  if (effect === "nebula") {
    return (
      <div
        className={`pointer-events-none absolute inset-y-0 ${side === "left" ? "left-0 w-[58%]" : "right-0 w-[58%]"}`}
        aria-hidden
      >
        <div
          className="absolute inset-0 mix-blend-screen"
          style={{
            background: `radial-gradient(ellipse 90% 80% at ${origin}, ${primaryA}, transparent 68%)`,
            filter: `blur(${blurLg}px)`,
          }}
        />
        <div
          className="absolute inset-0 mix-blend-screen"
          style={{
            background: `radial-gradient(ellipse 70% 60% at ${side === "left" ? "25% 40%" : "75% 60%"}, ${secondaryA}, transparent 70%)`,
            filter: `blur(${blurMd}px)`,
          }}
        />
        <div
          className="absolute inset-0 opacity-70 mix-blend-screen"
          style={{
            background: `radial-gradient(ellipse 50% 45% at ${side === "left" ? "15% 55%" : "85% 45%"}, ${rgba(colorSecondary, 0.2 * baseOpacity)}, transparent 75%)`,
            filter: `blur(${blurMd}px)`,
          }}
        />
      </div>
    );
  }

  if (effect === "ink") {
    return (
      <div
        className={`pointer-events-none absolute inset-y-0 ${side === "left" ? "left-0 w-[55%]" : "right-0 w-[55%]"}`}
        aria-hidden
      >
        <div
          className={`absolute top-[18%] h-[55%] w-[70%] mix-blend-screen ${align === "left" ? "left-[-8%]" : "right-[-8%]"}`}
          style={{
            borderRadius: "42% 58% 38% 62% / 48% 42% 58% 52%",
            background: `linear-gradient(145deg, ${primaryA}, ${secondaryA})`,
            filter: `blur(${blurMd}px)`,
          }}
        />
        <div
          className={`absolute bottom-[12%] h-[40%] w-[50%] mix-blend-screen ${align === "left" ? "left-[5%]" : "right-[5%]"}`}
          style={{
            borderRadius: "58% 42% 55% 45% / 40% 55% 45% 60%",
            background: primaryB,
            filter: `blur(${blurLg}px)`,
          }}
        />
      </div>
    );
  }

  if (effect === "electric") {
    return (
      <div
        className={`pointer-events-none absolute inset-y-0 ${side === "left" ? "left-0 w-[52%]" : "right-0 w-[52%]"}`}
        aria-hidden
      >
        <div
          className="absolute inset-0 mix-blend-screen"
          style={{
            background: `conic-gradient(from ${side === "left" ? "200deg" : "20deg"} at ${origin}, transparent, ${primaryA}, transparent 55%)`,
            filter: `blur(${blurMd}px)`,
          }}
        />
        <div
          className={`absolute top-1/2 h-[70%] w-[35%] -translate-y-1/2 mix-blend-plus-lighter ${side === "left" ? "right-0" : "left-0"}`}
          style={{
            background: `repeating-linear-gradient(${side === "left" ? "105deg" : "75deg"}, transparent, transparent 6px, ${rgba(colorSecondary, 0.35 * baseOpacity)} 6px, ${rgba(colorPrimary, 0.15 * baseOpacity)} 7px)`,
            filter: `blur(${compact ? 8 : 12}px)`,
            opacity: MOCKUP_CAMPUS_MEASURES.brandWashOpacity * 4,
          }}
        />
        <div
          className="absolute inset-0 mix-blend-screen"
          style={{
            background: `radial-gradient(ellipse 40% 90% at ${side === "left" ? "95% 50%" : "5% 50%"}, ${rgba(colorPrimary, 0.55 * baseOpacity)}, transparent 65%)`,
            filter: `blur(${compact ? 20 : 28}px)`,
          }}
        />
      </div>
    );
  }

  /* ember */
  return (
    <div
      className={`pointer-events-none absolute inset-y-0 ${side === "left" ? "left-0 w-[58%]" : "right-0 w-[58%]"}`}
      aria-hidden
    >
      <div
        className={`absolute inset-0 mix-blend-screen ${compact ? "" : "motion-safe:animate-pulse motion-reduce:animate-none"}`}
        style={{
          animationDuration: "5s",
          background: `radial-gradient(ellipse 85% 75% at ${origin}, ${primaryA}, transparent 65%)`,
          filter: `blur(${blurLg}px)`,
        }}
      />
      <div
        className="absolute inset-0 mix-blend-screen"
        style={{
          background: `radial-gradient(ellipse 60% 50% at ${side === "left" ? "30% 65%" : "70% 35%"}, ${rgba(colorSecondary, 0.35 * baseOpacity)}, transparent 72%)`,
          filter: `blur(${blurMd}px)`,
        }}
      />
    </div>
  );
}
