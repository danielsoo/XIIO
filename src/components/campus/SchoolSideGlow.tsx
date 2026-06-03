"use client";

import type { CSSProperties, ReactNode } from "react";
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

function GlowBlob({
  className,
  style,
  blurClass,
}: {
  className: string;
  style: CSSProperties;
  blurClass: string;
}) {
  return (
    <div className={`absolute ${className} ${blurClass} scale-110 opacity-90`}>
      <div className="h-full w-full" style={style} />
    </div>
  );
}

function SideContainer({
  side,
  children,
}: {
  side: "left" | "right";
  children: ReactNode;
}) {
  return (
    <div
      className={`pointer-events-none absolute inset-y-0 overflow-visible ${
        side === "left" ? "left-0 w-[62%]" : "right-0 w-[62%]"
      }`}
      aria-hidden
    >
      {children}
    </div>
  );
}

export default function SchoolSideGlow({
  side,
  colorPrimary,
  colorSecondary,
  effect,
  intensity = "active",
}: Props) {
  const compact = intensity === "compact";
  const wash = compact
    ? MOCKUP_CAMPUS_MEASURES.clashGlowOpacityCompact
    : MOCKUP_CAMPUS_MEASURES.brandWashOpacity;
  const blurLg = compact ? "blur-2xl" : "blur-3xl";
  const blurMd = compact ? "blur-xl" : "blur-2xl";
  const origin = side === "left" ? "0% 50%" : "100% 50%";
  const edgeClass = side === "left" ? "-left-[20%]" : "-right-[20%]";
  const midClass = side === "left" ? "left-[0%]" : "right-[0%]";
  const innerClass = side === "left" ? "left-[10%]" : "right-[10%]";

  const primary = (a: number) => rgba(colorPrimary, a * wash);
  const secondary = (a: number) => rgba(colorSecondary, a * wash);

  if (effect === "nebula") {
    return (
      <SideContainer side={side}>
        <GlowBlob
          blurClass={blurLg}
          className={`top-1/2 ${edgeClass} h-[130%] w-[90%] -translate-y-1/2`}
          style={{
            background: `radial-gradient(ellipse 80% 70% at ${origin}, ${primary(0.85)}, transparent 70%)`,
          }}
        />
        <GlowBlob
          blurClass={blurMd}
          className={`top-[20%] ${midClass} h-[70%] w-[75%]`}
          style={{
            background: `radial-gradient(ellipse 70% 65% at ${origin}, ${secondary(0.55)}, transparent 72%)`,
          }}
        />
        <GlowBlob
          blurClass={blurMd}
          className={`bottom-[5%] ${innerClass} h-[50%] w-[60%]`}
          style={{
            background: `radial-gradient(circle at ${origin}, ${primary(0.4)}, transparent 68%)`,
          }}
        />
      </SideContainer>
    );
  }

  if (effect === "ink") {
    return (
      <SideContainer side={side}>
        <GlowBlob
          blurClass={blurLg}
          className={`top-[10%] ${edgeClass} h-[75%] w-[80%]`}
          style={{
            borderRadius: "42% 58% 38% 62% / 48% 42% 58% 52%",
            background: `linear-gradient(145deg, ${primary(0.9)}, ${secondary(0.5)})`,
          }}
        />
        <GlowBlob
          blurClass={blurMd}
          className={`bottom-[0%] ${midClass} h-[55%] w-[65%]`}
          style={{
            borderRadius: "58% 42% 55% 45% / 40% 55% 45% 60%",
            background: primary(0.65),
          }}
        />
      </SideContainer>
    );
  }

  if (effect === "electric") {
    return (
      <SideContainer side={side}>
        <GlowBlob
          blurClass={blurMd}
          className={`top-1/2 ${edgeClass} h-[100%] w-[70%] -translate-y-1/2`}
          style={{
            background: `conic-gradient(from ${side === "left" ? "200deg" : "20deg"} at ${origin}, transparent, ${primary(0.9)}, transparent 50%)`,
          }}
        />
        <GlowBlob
          blurClass="blur-lg"
          className={`top-1/2 ${side === "left" ? "right-[5%]" : "left-[5%]"} h-[75%] w-[40%] -translate-y-1/2 opacity-80`}
          style={{
            background: `repeating-linear-gradient(${
              side === "left" ? "105deg" : "75deg"
            }, transparent, transparent 5px, ${secondary(0.7)} 5px, ${primary(0.35)} 6px)`,
          }}
        />
        <GlowBlob
          blurClass={blurLg}
          className={`top-1/2 ${side === "left" ? "right-[-5%]" : "left-[-5%]"} h-[90%] w-[45%] -translate-y-1/2`}
          style={{
            background: `radial-gradient(ellipse 50% 90% at ${side === "left" ? "100% 50%" : "0% 50%"}, ${primary(0.75)}, transparent 65%)`,
          }}
        />
      </SideContainer>
    );
  }

  return (
    <SideContainer side={side}>
      <GlowBlob
        blurClass={blurLg}
        className={`top-1/2 ${edgeClass} h-[125%] w-[88%] -translate-y-1/2 ${
          compact ? "" : "motion-safe:animate-pulse motion-reduce:animate-none"
        }`}
        style={{
          animationDuration: "5s",
          background: `radial-gradient(ellipse 85% 75% at ${origin}, ${primary(0.8)}, transparent 68%)`,
        }}
      />
      <GlowBlob
        blurClass={blurMd}
        className={`top-[25%] ${innerClass} h-[55%] w-[70%]`}
        style={{
          background: `radial-gradient(ellipse 65% 55% at ${origin}, ${secondary(0.6)}, transparent 70%)`,
        }}
      />
    </SideContainer>
  );
}
