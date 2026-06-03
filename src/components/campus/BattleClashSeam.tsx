"use client";

import { rgba } from "@/lib/campusBrandColors";

type Props = {
  colorLeft: string;
  colorRight: string;
  strong?: boolean;
};

export default function BattleClashSeam({ colorLeft, colorRight, strong = false }: Props) {
  const opacity = strong ? 0.55 : 0.38;
  return (
    <div
      className="pointer-events-none absolute inset-y-0 left-1/2 z-[1] w-[28%] -translate-x-1/2"
      aria-hidden
      style={{
        background: `linear-gradient(90deg, ${rgba(colorLeft, opacity)}, ${rgba("#ffffff", 0.06)}, ${rgba(colorRight, opacity)})`,
        filter: "blur(48px)",
        mixBlendMode: "screen",
      }}
    />
  );
}
