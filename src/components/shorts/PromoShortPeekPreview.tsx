"use client";

import type { PromoShort } from "@/types/promoShort";

const PEEK_SHELL_BASE =
  "relative h-full w-full origin-center overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-gray-900 via-[#1a0533]/90 to-gray-900 shadow-lg shadow-black/40";

type Props = {
  item: PromoShort;
  /** triptych: 외부 scale(peekScale)만 사용, 내부 scale-90 비활성 */
  compactShell?: boolean;
};

/** 홈 히어로 좌·우 피크 — 썸네일만 (HLS 없음, 깜빡임 없음) */
export default function PromoShortPeekPreview({ item, compactShell = false }: Props) {
  const shellClass = compactShell
    ? `${PEEK_SHELL_BASE} h-full w-full rounded-3xl`
    : `${PEEK_SHELL_BASE} scale-90`;
  return (
    <div className="relative h-full w-full pointer-events-none overflow-hidden rounded-3xl">
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
        <div className="absolute inset-0 bg-black/35 pointer-events-none" />
      </div>
    </div>
  );
}
