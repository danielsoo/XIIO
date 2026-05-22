"use client";

import PromoShortTriptychStage from "@/components/shorts/PromoShortTriptychStage";
import type { PromoShortLayout, PromoShortPlayerSize } from "@/components/shorts/PromoShortPlayer";
import type { PromoShort } from "@/types/promoShort";

type Props = {
  items: PromoShort[];
  index: number;
  onIndexChange: (index: number) => void;
  playerSize?: PromoShortPlayerSize;
  compact?: boolean;
  layout?: PromoShortLayout;
  viewportClassName?: string;
};

/** 홈 히어로 — 3프레임 회전문 캐러셀 */
export default function PromoShortCarousel(props: Props) {
  return <PromoShortTriptychStage {...props} />;
}
