"use client";

import { rgba } from "@/lib/campusBrandColors";

type Props = {
  colorLeft: string;
  colorRight: string;
  strong?: boolean;
};

export default function BattleClashSeam({ colorLeft, colorRight, strong = false }: Props) {
  const opacity = strong ? 0.85 : 0.65;
  return (
    <div
      className="pointer-events-none absolute inset-y-0 left-1/2 z-[1] w-[32%] -translate-x-1/2"
      aria-hidden
    >
      <div
        className="h-full w-full blur-3xl"
        style={{
          background: `linear-gradient(90deg, ${rgba(colorLeft, opacity)}, ${rgba("#ffffff", 0.12)}, ${rgba(colorRight, opacity)})`,
        }}
      />
    </div>
  );
}
