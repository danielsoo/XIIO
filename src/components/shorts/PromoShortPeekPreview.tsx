"use client";

import type { PromoShort } from "@/types/promoShort";

const PEEK_SHELL_BASE =
  "relative h-full w-full origin-center overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-gray-900 via-[#1a0533]/90 to-gray-900 shadow-lg shadow-black/40";

type Props = {
  item: PromoShort;
  /** triptych: 외부 scale(peekScale)만 사용, 내부 scale-90 비활성 */
  compactShell?: boolean;
  dimOverlay?: boolean;
  /** wrap arc 등 뒤로 도는 카드 — 중앙 뒤를 지날 때 더 어둡게 */
  dimStrong?: boolean;
};

/** 홈 히어로 좌·우 피크 — 썸네일만 (HLS 없음, 깜빡임 없음) */
export default function PromoShortPeekPreview({
  item,
  compactShell = false,
  dimOverlay = true,
  dimStrong = false,
}: Props) {
  const shellClass = compactShell ? `${PEEK_SHELL_BASE} h-full w-full` : `${PEEK_SHELL_BASE} scale-90`;
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
            className={`absolute inset-0 pointer-events-none ${
              dimStrong ? "bg-black/55" : "bg-black/35"
            }`}
          />
        ) : null}
      </div>
    </div>
  );
}
