"use client";

import type { PromoShort } from "@/types/promoShort";

const PEEK_SHELL =
  "relative h-full w-full scale-90 origin-center overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-gray-900 via-[#1a0533]/90 to-gray-900 shadow-lg shadow-black/40";

type Props = {
  item: PromoShort;
};

/** 홈 히어로 좌·우 피크 — 썸네일만 (HLS 없음, 깜빡임 없음) */
export default function PromoShortPeekPreview({ item }: Props) {
  return (
    <div className="relative h-full w-full pointer-events-none">
      <div className={PEEK_SHELL}>
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
