"use client";

import { useState } from "react";
import PromoShortCarouselStage from "@/components/shorts/PromoShortCarouselStage";
import PromoShortExpandedViewer from "@/components/shorts/PromoShortExpandedViewer";
import type { PromoShortLayout, PromoShortPlayerSize } from "@/components/shorts/PromoShortPlayer";
import { HOME_HERO_PEEK_VIEWPORT_CLASS } from "@/components/shorts/promoShortConstants";
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

/** 홈 히어로 — 4프레임(비대칭) 회전문 캐러셀 + 확대 뷰어 */
export default function PromoShortTriptychStage({
  items,
  index,
  onIndexChange,
  playerSize = "homeHeroSmall",
  compact = false,
  layout = "stacked",
  viewportClassName,
}: Props) {
  const [viewerOpen, setViewerOpen] = useState(false);

  return (
    <>
      <PromoShortCarouselStage
        items={items}
        index={index}
        onIndexChange={onIndexChange}
        centerMode="teaser"
        onTeaserExpandRequest={() => setViewerOpen(true)}
        playerSize={playerSize}
        compact={compact}
        layout={layout}
        viewportClassName={viewportClassName ?? HOME_HERO_PEEK_VIEWPORT_CLASS}
        swipeEnabled={!viewerOpen}
      />
      {viewerOpen ? (
        <PromoShortExpandedViewer
          items={items}
          index={index}
          onIndexChange={onIndexChange}
          onClose={() => setViewerOpen(false)}
        />
      ) : null}
    </>
  );
}
