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

function BrandLogoFrame({
  src,
  alt,
  frameClass,
  imageSizes,
  opacity,
}: {
  src: string;
  alt: string;
  frameClass: string;
  imageSizes: string;
  opacity: number;
}) {
  return (
    <div className={`relative h-full shrink-0 ${frameClass}`} style={{ opacity }}>
      <Image
        src={src}
        alt={alt}
        fill
        className="object-contain object-center"
        sizes={imageSizes}
        unoptimized
      />
    </div>
  );
}

/** Large watermark logos behind battle card copy — left/right in upper band (002 mockup) */
export default function BattleBrandLogos({
  schoolA,
  schoolB,
  variant = "active",
}: Props) {
  const compact = variant === "compact";
  const logoOpacity = compact
    ? MOCKUP_CAMPUS_MEASURES.brandLogoOpacityCompact
    : MOCKUP_CAMPUS_MEASURES.brandLogoOpacityActive;
  const frameClass = compact
    ? MOCKUP_CAMPUS.brandLogoCompactFrame
    : MOCKUP_CAMPUS.brandLogoActiveFrame;
  const bandBottom = compact ? "bottom-[36%]" : "bottom-[50%]";
  const imageSizes = compact ? "98px" : "154px";

  return (
    <div className="pointer-events-none absolute inset-0 z-[1] overflow-hidden" aria-hidden>
      <div
        className={`absolute inset-x-3 top-3 ${bandBottom} grid grid-cols-2 items-center`}
      >
        <div className="flex h-full items-center justify-center">
          <BrandLogoFrame
            src={schoolA.logo}
            alt=""
            frameClass={frameClass}
            imageSizes={imageSizes}
            opacity={logoOpacity}
          />
        </div>
        <div className="flex h-full items-center justify-center">
          <BrandLogoFrame
            src={schoolB.logo}
            alt=""
            frameClass={frameClass}
            imageSizes={imageSizes}
            opacity={logoOpacity}
          />
        </div>
      </div>
    </div>
  );
}
