"use client";

import type { PromoShort } from "@/types/promoShort";

const PEEK_SHELL_BASE =
  "relative h-full w-full origin-center overflow-hidden rounded-[14px] border border-white/10 bg-gradient-to-br from-gray-900 via-[#1a0533]/90 to-gray-900 shadow-lg shadow-black/40";

export type PromoShortPeekDimLevel = "default" | "strong" | "expandedSide";

const DIM_CLASS: Record<PromoShortPeekDimLevel, string> = {
  default: "bg-black/35",
  strong: "bg-black/55",
  expandedSide: "bg-black/60",
};

type Props = {
  item: PromoShort;
  /** triptych: 외부 scale(peekScale)만 사용, 내부 scale-90 비활성 */
  compactShell?: boolean;
  dimOverlay?: boolean;
  /** wrap arc 등 뒤로 도는 카드 — 중앙 뒤를 지날 때 더 어둡게 */
  dimStrong?: boolean;
  dimLevel?: PromoShortPeekDimLevel;
};

/** 홈 히어로 좌·우 피크 — 썸네일만 (HLS 없음, 깜빡임 없음) */
export default function PromoShortPeekPreview({
  item,
  compactShell = false,
  dimOverlay = true,
  dimStrong = false,
  dimLevel,
}: Props) {
  const shellClass = compactShell ? `${PEEK_SHELL_BASE} h-full w-full` : `${PEEK_SHELL_BASE} scale-90`;
  const resolvedDim: PromoShortPeekDimLevel = dimLevel ?? (dimStrong ? "strong" : "default");
  return (
    <div className="relative h-full w-full pointer-events-none">
      <div className={shellClass}>
        {item.thumbnailUrl ? (
          <img
            src={item.thumbnailUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            loading="eager"
            decoding="async"
          />
        ) : null}
        {dimOverlay ? (
          <div
            className={`absolute inset-0 pointer-events-none ${DIM_CLASS[resolvedDim]}`}
          />
        ) : null}
      </div>
    </div>
  );
}
