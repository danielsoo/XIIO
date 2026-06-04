"use client";

import BattleBrandLogos from "@/components/campus/BattleBrandLogos";
import BattleClashSeam from "@/components/campus/BattleClashSeam";
import SchoolSideGlow from "@/components/campus/SchoolSideGlow";
import {
  buildEffectSeed,
  getRotationEpoch,
  resolveBrandEffect,
} from "@/lib/campusBrandEffects";

export type ClashSchool = {
  id: string;
  name: string;
  logo: string;
  colorPrimary: string;
  colorSecondary: string;
};

type Props = {
  schoolA: ClashSchool;
  schoolB: ClashSchool;
  battleId: string;
  variant?: "active" | "compact";
};

export default function SchoolClashBackdrop({
  schoolA,
  schoolB,
  battleId,
  variant = "active",
}: Props) {
  const intensity = variant;
  const epoch = getRotationEpoch("week");
  const effectA = resolveBrandEffect(buildEffectSeed(schoolA.id, battleId, "left", epoch));
  const effectB = resolveBrandEffect(buildEffectSeed(schoolB.id, battleId, "right", epoch));
  const clashStrong = effectA !== effectB;
  const isActive = variant === "active";

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
      <SchoolSideGlow
        side="left"
        colorPrimary={schoolA.colorPrimary}
        colorSecondary={schoolA.colorSecondary}
        effect={effectA}
        intensity={intensity}
      />
      <SchoolSideGlow
        side="right"
        colorPrimary={schoolB.colorPrimary}
        colorSecondary={schoolB.colorSecondary}
        effect={effectB}
        intensity={intensity}
      />
      <BattleBrandLogos schoolA={schoolA} schoolB={schoolB} variant={variant} />
      {isActive ? (
        <BattleClashSeam
          colorLeft={schoolA.colorPrimary}
          colorRight={schoolB.colorPrimary}
          strong={clashStrong}
        />
      ) : null}
    </div>
  );
}
