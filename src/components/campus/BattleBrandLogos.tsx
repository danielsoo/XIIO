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
  const logoOpacity = compact
    ? MOCKUP_CAMPUS_MEASURES.brandLogoOpacityCompact
    : MOCKUP_CAMPUS_MEASURES.brandLogoOpacityActive;
  const sizeClass = compact ? MOCKUP_CAMPUS.brandLogoCompact : MOCKUP_CAMPUS.brandLogoActive;

  return (
    <div className="pointer-events-none absolute inset-0 z-[1] overflow-hidden" aria-hidden>
      <div
        className={`relative absolute top-[8%] left-[4%] ${sizeClass}`}
        style={{ opacity: logoOpacity }}
      >
        <Image
          src={schoolA.logo}
          alt=""
          fill
          className="object-contain object-left"
          sizes={compact ? "152px" : "240px"}
          unoptimized
        />
      </div>
      <div
        className={`relative absolute top-[8%] right-[4%] ${sizeClass}`}
        style={{ opacity: logoOpacity }}
      >
        <Image
          src={schoolB.logo}
          alt=""
          fill
          className="object-contain object-right"
          sizes={compact ? "152px" : "240px"}
          unoptimized
        />
      </div>
    </div>
  );
}
