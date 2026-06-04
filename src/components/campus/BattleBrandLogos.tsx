"use client";

import Image from "next/image";
import { MOCKUP_CAMPUS } from "@/lib/mockupCampusSpec";
import { MOCKUP_CAMPUS_MEASURES } from "@/lib/mockupLayout";
import type { ClashSchool } from "./SchoolClashBackdrop";

type Props = {
  schoolA: ClashSchool;
  schoolB: ClashSchool;
  variant?: "active" | "compact";
};

/** Large watermark logos behind battle card copy (002 mockup) */
export default function BattleBrandLogos({
  schoolA,
  schoolB,
  variant = "active",
}: Props) {
  const compact = variant === "compact";
  const baseOpacity = compact
    ? MOCKUP_CAMPUS_MEASURES.brandLogoOpacityCompact
    : MOCKUP_CAMPUS_MEASURES.brandLogoOpacityActive;
  const sizeClass = compact ? MOCKUP_CAMPUS.brandLogoCompact : MOCKUP_CAMPUS.brandLogoActive;
  const leftOpacity = Math.min(0.2, baseOpacity * 1.35);
  const rightOpacity = baseOpacity * 0.85;

  return (
    <div className="pointer-events-none absolute inset-0 z-[1] overflow-hidden" aria-hidden>
      <div
        className={`relative absolute top-1/2 -translate-y-1/2 ${sizeClass} ${
          compact ? "-left-[18%]" : "-left-[12%]"
        }`}
        style={{ opacity: leftOpacity }}
      >
        <Image
          src={schoolA.logo}
          alt=""
          fill
          className="object-contain object-left"
          sizes={compact ? "120px" : "240px"}
          unoptimized
        />
      </div>
      <div
        className={`relative absolute top-1/2 -translate-y-1/2 ${sizeClass} ${
          compact ? "-right-[18%]" : "-right-[12%]"
        }`}
        style={{ opacity: rightOpacity }}
      >
        <Image
          src={schoolB.logo}
          alt=""
          fill
          className="object-contain object-right"
          sizes={compact ? "120px" : "240px"}
          unoptimized
        />
      </div>
      <div
        className={`absolute inset-y-0 right-0 w-[58%] ${
          compact
            ? "bg-gradient-to-l from-[#020408]/95 via-[#020408]/45 to-transparent"
            : "bg-gradient-to-l from-[#020408]/90 via-[#020408]/35 to-transparent"
        }`}
      />
      <div className="absolute inset-y-0 left-0 w-[35%] bg-gradient-to-r from-[#020408]/50 to-transparent" />
    </div>
  );
}
