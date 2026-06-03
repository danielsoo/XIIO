"use client";

import type { CSSProperties } from "react";
import Image from "next/image";
import { MOCKUP_CAMPUS } from "@/lib/mockupCampusSpec";
import { MOCKUP_CAMPUS_MEASURES } from "@/lib/mockupLayout";

type SchoolBrand = {
  color: string;
  logo: string;
  name: string;
};

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function colorWashStyle(hex: string, side: "left" | "right"): CSSProperties {
  const { r, g, b } = hexToRgb(hex);
  const alpha = MOCKUP_CAMPUS_MEASURES.brandWashOpacity;
  const rgba = `rgba(${r}, ${g}, ${b}, ${alpha})`;
  if (side === "left") {
    return {
      background: `radial-gradient(ellipse 80% 90% at 0% 50%, ${rgba}, transparent 70%)`,
    };
  }
  return {
    background: `radial-gradient(ellipse 80% 90% at 100% 50%, ${rgba}, transparent 70%)`,
  };
}

type Props = {
  schoolA: SchoolBrand;
  schoolB: SchoolBrand;
  variant?: "active" | "compact";
};

export default function SchoolBrandBackdrop({
  schoolA,
  schoolB,
  variant = "active",
}: Props) {
  const isActive = variant === "active";
  const logoOpacity = isActive
    ? MOCKUP_CAMPUS_MEASURES.brandLogoOpacityActive
    : MOCKUP_CAMPUS_MEASURES.brandLogoOpacityCompact;
  const logoClass = isActive ? MOCKUP_CAMPUS.brandLogoActive : MOCKUP_CAMPUS.brandLogoCompact;

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-y-0 left-0 w-1/2" style={colorWashStyle(schoolA.color, "left")} />
      <div className="absolute inset-y-0 right-0 w-1/2" style={colorWashStyle(schoolB.color, "right")} />

      <div
        className={`absolute -left-8 top-1/2 -translate-y-1/2 ${logoClass}`}
        style={{ opacity: logoOpacity }}
      >
        <Image
          src={schoolA.logo}
          alt=""
          width={isActive ? 240 : 120}
          height={isActive ? 240 : 120}
          className="h-full w-full object-contain"
          unoptimized
        />
      </div>
      <div
        className={`absolute -right-8 top-1/2 -translate-y-1/2 ${logoClass}`}
        style={{ opacity: logoOpacity }}
      >
        <Image
          src={schoolB.logo}
          alt=""
          width={isActive ? 240 : 120}
          height={isActive ? 240 : 120}
          className="h-full w-full object-contain"
          unoptimized
        />
      </div>
    </div>
  );
}
