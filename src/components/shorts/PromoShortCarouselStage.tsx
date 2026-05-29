"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { useHorizontalSwipe } from "@/hooks/useHorizontalSwipe";
import {
  FADE_MS,
  REVOLVE_MS,
  getTransitionMode,
} from "@/components/shorts/promoCarouselTransition";
import {
  shouldWarmExpandedStripItem,
  shouldWarmTeaserStripItem,
} from "@/components/shorts/promoCarouselUtils";
import PromoShortPeekPreview from "@/components/shorts/PromoShortPeekPreview";
import type { PromoShortPeekDimLevel } from "@/components/shorts/PromoShortPeekPreview";
import PromoShortPlayer, {
  type PromoShortLayout,
  type PromoShortPlayerSize,
  EXPANDED_VIEWER_CENTER_FRAME_CLASS,
  EXPANDED_VIEWER_OUTER_PEEK_FRAME_CLASS,
  EXPANDED_VIEWER_PEEK_FRAME_CLASS,
  HOME_HERO_PEEK_VIEWPORT_CLASS,
  HOME_HERO_TEASER_FRAME_CLASS,
} from "@/components/shorts/PromoShortPlayer";
import { useTranslations } from "@/context/LocaleContext";
import type { PromoShort } from "@/types/promoShort";

type TeaserQuartet = {
  farLeft: PromoShort;
  left: PromoShort;
  center: PromoShort;
  right: PromoShort;
};

type Quintet = {
  farLeft: PromoShort;
  left: PromoShort;
  center: PromoShort;
  right: PromoShort;
  farRight: PromoShort;
};

type CarouselSnapshot = TeaserQuartet | Quintet;

type RevolvePhase = "idle" | "toNext" | "toPrev";
type ActiveTransitionMode = "revolve" | "fade" | "slide";

type TeaserSlotRole = "farLeft" | "left" | "center" | "right" | "incoming";
type ExpandedStripRole = "farLeft" | "left" | "center" | "right" | "farRight" | "incoming";
type PlacementRole = TeaserSlotRole | ExpandedStripRole;

const ENTER_GAP_PX = 100;
const STAGE_GAP_PX = 16;
/** tailwind max-w-lg — 확대 중앙 측정·초기 metrics */
const EXPANDED_CENTER_MEASURE_WIDTH_PX = 512;
/** 확대 인접(±1)–중앙 사이 여백 */
const EXPANDED_ADJACENT_GAP = 84;
/** 확대 인접–외곽(±2) 사이 여백 */
const EXPANDED_OUTER_GAP = 28;
/** 확대 피크 전용 프레임 사용 시 transform scale (프레임 너비가 크기 담당) */
const EXPANDED_PEEK_SCALE = 1;
/** 외곽 피크 미세 축소 */
const EXPANDED_OUTER_PEEK_SCALE = 0.93;
/** sm:max-w-[16rem] — 초기 adjacent peek 측정 fallback */
const EXPANDED_PEEK_MEASURE_WIDTH_PX = 256;
/** sm:max-w-[12rem] — 초기 outer peek 측정 fallback */
const EXPANDED_OUTER_MEASURE_WIDTH_PX = 192;

function isQuintetSnapshot(s: CarouselSnapshot): s is Quintet {
  return "farRight" in s;
}

function isTeaserQuartetSnapshot(s: CarouselSnapshot): s is TeaserQuartet {
  return "farLeft" in s && !("farRight" in s);
}
/** 피크 시각 너비 / teaser 프레임 (HOME_HERO_PEEK_SIDE 160|180 vs teaser 200|236) */
const PEEK_SCALE_SM = 180 / 236;
const PEEK_SCALE_DEFAULT = 160 / 200;
const HERO_CAROUSEL_ROUNDED_CLASS = "rounded-[14px] overflow-hidden";
const HERO_CAROUSEL_WRAP_ROUNDED_CLASS = "rounded-[14px] overflow-hidden";
const CAROUSEL_BACK_LAYER_CLASS = "absolute inset-0 z-[1] pointer-events-none [&>*]:pointer-events-auto";
const CAROUSEL_FRONT_LAYER_CLASS = "absolute inset-0 z-[10]";
const HERO_CAROUSEL_FRAME_CLASS = `${HOME_HERO_TEASER_FRAME_CLASS} ${HERO_CAROUSEL_ROUNDED_CLASS}`;
const HERO_CAROUSEL_WRAP_FRAME_CLASS = `${HOME_HERO_TEASER_FRAME_CLASS} ${HERO_CAROUSEL_WRAP_ROUNDED_CLASS}`;
const CAROUSEL_BACK_SCALE_RATIO = 0.52;
const SLIDE_MS = 560;
/** endTransition 타이머와 동일 — 프레임 커밋 지연 */
const SLIDE_COMMIT_BUFFER_MS = 80;
const SLIDE_ENTER_EXTRA_PX = 20;
const EXPANDED_EDGE_ENTER_FADE = 0.22;
type VisiblePreloadMode = "hybrid" | "allAuto";
const VISIBLE_PRELOAD_MODE: VisiblePreloadMode = "hybrid";

function peekScaleRatio(): number {
  if (typeof window === "undefined") return PEEK_SCALE_DEFAULT;
  return window.matchMedia("(min-width: 640px)").matches ? PEEK_SCALE_SM : PEEK_SCALE_DEFAULT;
}

/** 피크 카드 안 화살표가 쓰이던 inset (right-2 / left-2) */
const NAV_ARROW_INSET_PX = 8;

type LayoutMetricsOptions = {
  stageGapPx?: number;
  peekScale?: number;
  /** 확대 피크 전용 프레임 실측 너비 — 있으면 centerW * peekScale 대신 사용 */
  peekVisualWidthPx?: number;
};

function layoutMetricsFromCenterWidth(
  centerW: number,
  options: LayoutMetricsOptions = {}
): LayoutMetrics {
  const peekScale = options.peekScale ?? peekScaleRatio();
  const stageGapPx = options.stageGapPx ?? STAGE_GAP_PX;
  const peekVisualW = options.peekVisualWidthPx ?? centerW * peekScale;
  const farVisualW = peekVisualW * CAROUSEL_BACK_SCALE_RATIO;
  const offsetX = centerW / 2 + stageGapPx + peekVisualW / 2;
  const offsetFarLeft = offsetX + stageGapPx + peekVisualW / 2 + stageGapPx + farVisualW / 2;
  const farScale = peekScale * CAROUSEL_BACK_SCALE_RATIO;
  /** 슬롯 scale 적용 후 피크 안쪽 가장자리(화살표 앵커) */
  const peekInnerArrowAnchorPx = options.peekVisualWidthPx
    ? peekVisualW / 2 - NAV_ARROW_INSET_PX
    : (centerW / 2 - NAV_ARROW_INSET_PX) * peekScale;
  return {
    centerW,
    offsetX,
    offsetFarLeft,
    peekScale,
    farScale,
    peekInnerArrowAnchorPx,
  };
}

type LayoutMetrics = {
  centerW: number;
  offsetX: number;
  offsetFarLeft: number;
  peekScale: number;
  farScale: number;
  peekInnerArrowAnchorPx: number;
};

type ExpandedStripMetrics = LayoutMetrics & {
  offsetAdjacent: number;
  offsetOuter: number;
  peekAdjacentW: number;
  peekOuterW: number;
};

function expandedStripMetricsFromCenterWidth(
  centerW: number,
  peekAdjacentW: number,
  peekOuterW: number
): ExpandedStripMetrics {
  const peekScale = EXPANDED_PEEK_SCALE;
  const offsetAdjacent = centerW / 2 + EXPANDED_ADJACENT_GAP + peekAdjacentW / 2;
  const offsetOuter =
    offsetAdjacent + peekAdjacentW / 2 + EXPANDED_OUTER_GAP + peekOuterW / 2;
  const peekInnerArrowAnchorPx = peekAdjacentW / 2 - NAV_ARROW_INSET_PX;
  const farScale = (peekAdjacentW / Math.max(centerW, 1)) * EXPANDED_OUTER_PEEK_SCALE;
  return {
    centerW,
    offsetX: offsetAdjacent,
    offsetFarLeft: offsetOuter,
    offsetAdjacent,
    offsetOuter,
    peekScale,
    farScale,
    peekAdjacentW,
    peekOuterW,
    peekInnerArrowAnchorPx,
  };
}

export type PromoShortCarouselCenterMode = "teaser" | "expanded";

type Props = {
  items: PromoShort[];
  index: number;
  onIndexChange: (index: number) => void;
  centerMode?: PromoShortCarouselCenterMode;
  onTeaserExpandRequest?: () => void;
  playerSize?: PromoShortPlayerSize;
  compact?: boolean;
  layout?: PromoShortLayout;
  viewportClassName?: string;
  stageMinHeight?: string;
  /** false면 스와이프·화살표 키 비활성 (메인에서 확대 뷰어 열림) */
  swipeEnabled?: boolean;
};

const PEEK_CAROUSEL_ARROW_BASE =
  "flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center p-0 bg-transparent border-0 text-[2.75rem] sm:text-[3.25rem] font-light leading-none text-white hover:text-white/80 transition pointer-events-auto focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent drop-shadow-[0_1px_4px_rgba(0,0,0,0.4)] [text-shadow:0_1px_2px_rgba(0,0,0,0.45),0_0_6px_rgba(0,0,0,0.3)] [-webkit-text-stroke:0.5px_rgba(0,0,0,0.18)]";
/** top-1/2 + translate Y만 공통 — X는 피크 right-2/left-2 와 동일 앵커 */
const FIXED_CAROUSEL_ARROW_CLASS = `absolute top-1/2 ${PEEK_CAROUSEL_ARROW_BASE}`;
const PEEK_TAP_LAYER_BASE =
  "absolute inset-y-0 z-40 w-[40%] cursor-pointer rounded-[14px] bg-transparent";
const PEEK_TAP_LAYER_LEFT = `${PEEK_TAP_LAYER_BASE} left-0`;
const PEEK_TAP_LAYER_RIGHT = `${PEEK_TAP_LAYER_BASE} right-0`;

function teaserQuartetAt(items: PromoShort[], centerIndex: number): TeaserQuartet {
  const n = items.length;
  return {
    farLeft: items[(centerIndex - 2 + n) % n]!,
    left: items[(centerIndex - 1 + n) % n]!,
    center: items[centerIndex]!,
    right: items[(centerIndex + 1) % n]!,
  };
}

function getVisibleTeaserRoles(quartet: TeaserQuartet, count: number): Set<TeaserSlotRole> {
  const visible = new Set<TeaserSlotRole>(["center"]);
  if (count >= 2) {
    if (quartet.left.id !== quartet.center.id) visible.add("left");
    if (quartet.right.id !== quartet.center.id) visible.add("right");
  }
  if (count >= 4) {
    if (quartet.farLeft.id !== quartet.left.id && quartet.farLeft.id !== quartet.center.id) {
      visible.add("farLeft");
    }
  }
  return visible;
}

function quintetAt(items: PromoShort[], centerIndex: number): Quintet {
  const n = items.length;
  return {
    farLeft: items[(centerIndex - 2 + n) % n]!,
    left: items[(centerIndex - 1 + n) % n]!,
    center: items[centerIndex]!,
    right: items[(centerIndex + 1) % n]!,
    farRight: items[(centerIndex + 2) % n]!,
  };
}

function getVisibleExpandedRoles(quintet: Quintet, count: number): Set<ExpandedStripRole> {
  const visible = new Set<ExpandedStripRole>(["center"]);
  if (count >= 2) {
    if (quintet.left.id !== quintet.center.id) visible.add("left");
    if (quintet.right.id !== quintet.center.id) visible.add("right");
  }
  if (count >= 5) {
    if (quintet.farLeft.id !== quintet.left.id) visible.add("farLeft");
    if (quintet.farRight.id !== quintet.right.id) visible.add("farRight");
  } else if (count === 4) {
    if (quintet.farLeft.id !== quintet.left.id && quintet.farLeft.id !== quintet.center.id) {
      visible.add("farLeft");
    }
    if (quintet.farRight.id !== quintet.right.id && quintet.farRight.id !== quintet.center.id) {
      visible.add("farRight");
    }
  }
  return visible;
}

/** 확대 strip 5단 크기 — center frame 기준 실측 scale (peek/outer max-w와 동일 체감) */
function expandedStripScales(metrics: ExpandedStripMetrics) {
  const { centerW, peekAdjacentW, peekOuterW } = metrics;
  const safeCenterW = Math.max(centerW, 1);
  return {
    adjacentScale: peekAdjacentW / safeCenterW,
    outerScale: (peekOuterW / safeCenterW) * EXPANDED_OUTER_PEEK_SCALE,
  };
}

function expandedStripSlotTransform(
  role: ExpandedStripRole,
  phase: RevolvePhase,
  metrics: ExpandedStripMetrics
): { transform: string; opacity: number; zIndex: number } {
  const { offsetAdjacent, offsetOuter } = metrics;
  const { adjacentScale, outerScale } = expandedStripScales(metrics);

  if (phase === "idle") {
    switch (role) {
      case "farLeft":
        return {
          transform: `translateX(${-offsetOuter}px) scale(${outerScale})`,
          opacity: 1,
          zIndex: 18,
        };
      case "left":
        return {
          transform: `translateX(${-offsetAdjacent}px) scale(${adjacentScale})`,
          opacity: 1,
          zIndex: 20,
        };
      case "center":
        return { transform: "translateX(0) scale(1)", opacity: 1, zIndex: 25 };
      case "right":
        return {
          transform: `translateX(${offsetAdjacent}px) scale(${adjacentScale})`,
          opacity: 1,
          zIndex: 20,
        };
      case "farRight":
        return {
          transform: `translateX(${offsetOuter}px) scale(${outerScale})`,
          opacity: 1,
          zIndex: 18,
        };
      default:
        return { transform: "translateX(0) scale(1)", opacity: 1, zIndex: 18 };
    }
  }

  if (phase === "toNext") {
    switch (role) {
      case "farLeft":
        return {
          transform: `translateX(${-offsetOuter - SLIDE_ENTER_EXTRA_PX}px) scale(${outerScale})`,
          opacity: EXPANDED_EDGE_ENTER_FADE,
          zIndex: 1,
        };
      case "left":
        return {
          transform: `translateX(${-offsetOuter}px) scale(${outerScale})`,
          opacity: 1,
          zIndex: 18,
        };
      case "center":
        return {
          transform: `translateX(${-offsetAdjacent}px) scale(${adjacentScale})`,
          opacity: 1,
          zIndex: 20,
        };
      case "right":
        return { transform: "translateX(0) scale(1)", opacity: 1, zIndex: 25 };
      case "farRight":
        return {
          transform: `translateX(${offsetAdjacent}px) scale(${adjacentScale})`,
          opacity: 1,
          zIndex: 20,
        };
      default:
        return { transform: "translateX(0) scale(1)", opacity: 1, zIndex: 18 };
    }
  }

  if (phase === "toPrev") {
    switch (role) {
      case "farRight":
        return {
          transform: `translateX(${offsetOuter + SLIDE_ENTER_EXTRA_PX}px) scale(${outerScale})`,
          opacity: EXPANDED_EDGE_ENTER_FADE,
          zIndex: 1,
        };
      case "right":
        return {
          transform: `translateX(${offsetOuter}px) scale(${outerScale})`,
          opacity: 1,
          zIndex: 18,
        };
      case "center":
        return {
          transform: `translateX(${offsetAdjacent}px) scale(${adjacentScale})`,
          opacity: 1,
          zIndex: 20,
        };
      case "left":
        return { transform: "translateX(0) scale(1)", opacity: 1, zIndex: 25 };
      case "farLeft":
        return {
          transform: `translateX(${-offsetAdjacent}px) scale(${adjacentScale})`,
          opacity: 1,
          zIndex: 20,
        };
      default:
        return { transform: "translateX(0) scale(1)", opacity: 1, zIndex: 18 };
    }
  }

  return { transform: "translateX(0) scale(1)", opacity: 1, zIndex: 18 };
}

function expandedIncomingSlotTransform(
  phase: "toNext" | "toPrev",
  atEnter: boolean,
  metrics: ExpandedStripMetrics
): { transform: string; opacity: number; zIndex: number } {
  const { offsetOuter } = metrics;
  const { outerScale } = expandedStripScales(metrics);
  const enterX = offsetOuter + SLIDE_ENTER_EXTRA_PX;

  if (phase === "toNext") {
    if (atEnter) {
      return {
        transform: `translateX(${enterX}px) scale(${outerScale})`,
        opacity: EXPANDED_EDGE_ENTER_FADE,
        zIndex: 18,
      };
    }
    return {
      transform: `translateX(${offsetOuter}px) scale(${outerScale})`,
      opacity: 1,
      zIndex: 18,
    };
  }

  if (atEnter) {
    return {
      transform: `translateX(${-enterX}px) scale(${outerScale})`,
      opacity: EXPANDED_EDGE_ENTER_FADE,
      zIndex: 18,
    };
  }
  return {
    transform: `translateX(${-offsetOuter}px) scale(${outerScale})`,
    opacity: 1,
    zIndex: 18,
  };
}

function expandedIncomingItemAt(
  items: PromoShort[],
  centerIndex: number,
  phase: "toNext" | "toPrev"
): PromoShort {
  const n = items.length;
  if (phase === "toNext") return items[(centerIndex + 3) % n]!;
  return items[(centerIndex - 3 + n) % n]!;
}

function slotTransform(
  role: TeaserSlotRole,
  phase: RevolvePhase,
  metrics: LayoutMetrics
): { transform: string; opacity: number; zIndex: number } {
  const { offsetX, offsetFarLeft, peekScale, farScale } = metrics;

  if (phase === "idle") {
    if (role === "farLeft") {
      return {
        transform: `translateX(${-offsetFarLeft}px) scale(${farScale})`,
        opacity: 1,
        zIndex: 10,
      };
    }
    if (role === "left") {
      return {
        transform: `translateX(${-offsetX}px) scale(${peekScale})`,
        opacity: 1,
        zIndex: 15,
      };
    }
    if (role === "right") {
      return {
        transform: `translateX(${offsetX}px) scale(${peekScale})`,
        opacity: 1,
        zIndex: 15,
      };
    }
    return { transform: "translateX(0) scale(1)", opacity: 1, zIndex: 25 };
  }

  if (phase === "toNext") {
    if (role === "farLeft") {
      return {
        transform: `translateX(${-offsetFarLeft - SLIDE_ENTER_EXTRA_PX}px) scale(${farScale})`,
        opacity: EXPANDED_EDGE_ENTER_FADE,
        zIndex: 1,
      };
    }
    if (role === "left") {
      return {
        transform: `translateX(${-offsetFarLeft}px) scale(${farScale})`,
        opacity: 1,
        zIndex: 12,
      };
    }
    if (role === "center") {
      return {
        transform: `translateX(${-offsetX}px) scale(${peekScale})`,
        opacity: 1,
        zIndex: 20,
      };
    }
    return { transform: "translateX(0) scale(1)", opacity: 1, zIndex: 25 };
  }

  if (role === "farLeft") {
    return {
      transform: `translateX(${-offsetX}px) scale(${peekScale})`,
      opacity: 1,
      zIndex: 12,
    };
  }
  if (role === "right") {
    return {
      transform: `translateX(${offsetX + SLIDE_ENTER_EXTRA_PX}px) scale(${peekScale})`,
      opacity: EXPANDED_EDGE_ENTER_FADE,
      zIndex: 1,
    };
  }
  if (role === "center") {
    return {
      transform: `translateX(${offsetX}px) scale(${peekScale})`,
      opacity: 1,
      zIndex: 20,
    };
  }
  if (role === "left") {
    return { transform: "translateX(0) scale(1)", opacity: 1, zIndex: 25 };
  }
  return { transform: "translateX(0) scale(1)", opacity: 1, zIndex: 25 };
}

function incomingSlotTransform(
  phase: "toNext" | "toPrev",
  atEnter: boolean,
  metrics: LayoutMetrics,
  count: number
): { transform: string; opacity: number; zIndex: number } {
  const { offsetX, offsetFarLeft, peekScale, farScale } = metrics;
  const useFarEnter = count >= 4 && phase === "toPrev";
  const enterX = (useFarEnter ? offsetFarLeft : offsetX) + SLIDE_ENTER_EXTRA_PX;
  const enterScale = useFarEnter ? farScale : peekScale;
  const settleX = useFarEnter ? -offsetFarLeft : -offsetX;
  const settleScale = useFarEnter ? farScale : peekScale;

  if (phase === "toNext") {
    if (atEnter) {
      return {
        transform: `translateX(${enterX}px) scale(${peekScale})`,
        opacity: EXPANDED_EDGE_ENTER_FADE,
        zIndex: 15,
      };
    }
    return {
      transform: `translateX(${offsetX}px) scale(${peekScale})`,
      opacity: 1,
      zIndex: 15,
    };
  }

  if (atEnter) {
    return {
      transform: `translateX(${-enterX}px) scale(${enterScale})`,
      opacity: EXPANDED_EDGE_ENTER_FADE,
      zIndex: useFarEnter ? 10 : 15,
    };
  }
  return {
    transform: `translateX(${settleX}px) scale(${settleScale})`,
    opacity: 1,
    zIndex: useFarEnter ? 10 : 15,
  };
}

function incomingItemAt(
  items: PromoShort[],
  centerIndex: number,
  phase: "toNext" | "toPrev",
  count: number
): PromoShort {
  const n = items.length;
  if (phase === "toNext") return items[(centerIndex + 2) % n]!;
  if (count >= 4) return items[(centerIndex - 3 + n) % n]!;
  return items[(centerIndex - 2 + n) % n]!;
}

type ItemPlacement = {
  visible: boolean;
  role?: PlacementRole;
  transform: string;
  opacity: number;
  zIndex: number;
  frameClass: string;
  isCenter: boolean;
};

function expandedRoleDimLevel(role: PlacementRole | undefined): PromoShortPeekDimLevel | null {
  if (!role || role === "center") return null;
  if (role === "farLeft" || role === "farRight" || role === "incoming") return "expandedOuter";
  return "expandedSide";
}

function shiftedExpandedRole(
  role: PlacementRole | undefined,
  phase: RevolvePhase
): PlacementRole | undefined {
  if (!role || phase === "idle") return role;
  if (phase === "toNext") {
    switch (role) {
      case "left":
        return "farLeft";
      case "center":
        return "left";
      case "right":
        return "center";
      case "farRight":
        return "right";
      case "incoming":
        return "farRight";
      default:
        return role;
    }
  }
  switch (role) {
    case "right":
      return "farRight";
    case "center":
      return "right";
    case "left":
      return "center";
    case "farLeft":
      return "left";
    case "incoming":
      return "farLeft";
    default:
      return role;
  }
}

function shiftedTeaserRole(
  role: PlacementRole | undefined,
  phase: RevolvePhase
): PlacementRole | undefined {
  if (!role || phase === "idle") return role;
  if (phase === "toNext") {
    switch (role) {
      case "left":
        return "farLeft";
      case "center":
        return "left";
      case "right":
        return "center";
      case "incoming":
        return "right";
      default:
        return role;
    }
  }
  switch (role) {
    case "center":
      return "right";
    case "left":
      return "center";
    case "farLeft":
      return "left";
    case "incoming":
      return "farLeft";
    default:
      return role;
  }
}

function teaserRoleDimLevel(role: PlacementRole | undefined): PromoShortPeekDimLevel | null {
  if (!role || role === "center") return null;
  if (role === "farLeft" || role === "incoming") return "expandedOuter";
  return "expandedSide";
}

function placementForTeaserItem(
  itemId: string,
  displayQuartet: TeaserQuartet,
  count: number,
  incomingItem: PromoShort | null,
  incomingStyle: { transform: string; opacity: number; zIndex: number } | null,
  revolvePhase: RevolvePhase,
  metrics: LayoutMetrics,
  slotFrameClass: string,
  keepEdgeVisibleDuringShift: boolean
): ItemPlacement {
  const visibleRoles = getVisibleTeaserRoles(displayQuartet, count);
  const incomingMinCount = count >= 4 ? 4 : 3;

  if (count >= incomingMinCount && incomingItem && incomingStyle && incomingItem.id === itemId) {
    return {
      visible: true,
      role: "incoming",
      transform: incomingStyle.transform,
      opacity: incomingStyle.opacity,
      zIndex: incomingStyle.zIndex,
      frameClass: slotFrameClass,
      isCenter: false,
    };
  }

  const roleEntries: { role: TeaserSlotRole; item: PromoShort }[] = [
    { role: "farLeft", item: displayQuartet.farLeft },
    { role: "left", item: displayQuartet.left },
    { role: "center", item: displayQuartet.center },
    { role: "right", item: displayQuartet.right },
  ];

  for (const { role, item } of roleEntries) {
    const keepEdgeVisible =
      keepEdgeVisibleDuringShift && (role === "farLeft" || role === "right");
    if (item.id !== itemId || (!visibleRoles.has(role) && !keepEdgeVisible)) continue;
    const s = slotTransform(role, revolvePhase, metrics);
    return {
      visible: true,
      role,
      transform: s.transform,
      opacity: s.opacity,
      zIndex: s.zIndex,
      frameClass: slotFrameClass,
      isCenter: role === "center",
    };
  }

  return {
    visible: false,
    transform: "translateX(0) scale(1)",
    opacity: 0,
    zIndex: 0,
    frameClass: slotFrameClass,
    isCenter: false,
  };
}

function placementForExpandedItem(
  itemId: string,
  displayQuintet: Quintet,
  count: number,
  incomingItem: PromoShort | null,
  incomingStyle: { transform: string; opacity: number; zIndex: number } | null,
  revolvePhase: RevolvePhase,
  metrics: ExpandedStripMetrics,
  slotFrameClass: string,
  keepEdgeVisibleDuringShift: boolean
): ItemPlacement {
  const visibleRoles = getVisibleExpandedRoles(displayQuintet, count);

  if (count >= 5 && incomingItem && incomingStyle && incomingItem.id === itemId) {
    return {
      visible: true,
      role: "incoming",
      transform: incomingStyle.transform,
      opacity: incomingStyle.opacity,
      zIndex: incomingStyle.zIndex,
      frameClass: slotFrameClass,
      isCenter: false,
    };
  }

  const roleEntries: { role: ExpandedStripRole; item: PromoShort }[] = [
    { role: "farLeft", item: displayQuintet.farLeft },
    { role: "left", item: displayQuintet.left },
    { role: "center", item: displayQuintet.center },
    { role: "right", item: displayQuintet.right },
    { role: "farRight", item: displayQuintet.farRight },
  ];

  for (const { role, item } of roleEntries) {
    const keepEdgeVisible =
      keepEdgeVisibleDuringShift && (role === "farLeft" || role === "farRight");
    if (item.id !== itemId || (!visibleRoles.has(role) && !keepEdgeVisible)) continue;
    const s = expandedStripSlotTransform(role, revolvePhase, metrics);
    return {
      visible: true,
      role,
      transform: s.transform,
      opacity: s.opacity,
      zIndex: s.zIndex,
      frameClass: slotFrameClass,
      isCenter: role === "center",
    };
  }

  return {
    visible: false,
    transform: "translateX(0) scale(1)",
    opacity: 0,
    zIndex: 0,
    frameClass: slotFrameClass,
    isCenter: false,
  };
}

export default function PromoShortCarouselStage({
  items,
  index,
  onIndexChange,
  centerMode = "teaser",
  onTeaserExpandRequest,
  playerSize = "homeHeroSmall",
  compact = false,
  layout = "stacked",
  viewportClassName,
  stageMinHeight: stageMinHeightProp,
  swipeEnabled: swipeEnabledProp = true,
}: Props) {
  const isExpandedCenter = centerMode === "expanded";
  const carouselFrameClass = isExpandedCenter
    ? EXPANDED_VIEWER_CENTER_FRAME_CLASS
    : HERO_CAROUSEL_FRAME_CLASS;
  const carouselWrapFrameClass = isExpandedCenter
    ? EXPANDED_VIEWER_CENTER_FRAME_CLASS
    : HERO_CAROUSEL_WRAP_FRAME_CLASS;
  const { t } = useTranslations();
  const count = items.length;
  const current = items[index];

  const prevIndexRef = useRef(index);
  const indexRef = useRef(index);
  const requestedDirectionRef = useRef<1 | -1>(1);
  const isTransitioningRef = useRef(false);
  const pendingStepRef = useRef(0);
  const pendingFadeTargetRef = useRef<number | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const centerMeasureRef = useRef<HTMLDivElement>(null);
  const peekMeasureRef = useRef<HTMLDivElement>(null);
  const outerPeekMeasureRef = useRef<HTMLDivElement>(null);

  const [metrics, setMetrics] = useState<LayoutMetrics | ExpandedStripMetrics>(() =>
    isExpandedCenter
      ? expandedStripMetricsFromCenterWidth(
          EXPANDED_CENTER_MEASURE_WIDTH_PX,
          EXPANDED_PEEK_MEASURE_WIDTH_PX,
          EXPANDED_OUTER_MEASURE_WIDTH_PX
        )
      : layoutMetricsFromCenterWidth(200)
  );
  const [revolvePhase, setRevolvePhase] = useState<RevolvePhase>("idle");
  const [revolveEpoch, setRevolveEpoch] = useState(0);
  const [snapshot, setSnapshot] = useState<CarouselSnapshot | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [outgoingCenterId, setOutgoingCenterId] = useState<string | null>(null);
  const [viewportOpacity, setViewportOpacity] = useState(1);
  const [transitionMode, setTransitionMode] = useState<ActiveTransitionMode>("revolve");
  const [animPrevIndex, setAnimPrevIndex] = useState(0);
  const [incomingAtEnter, setIncomingAtEnter] = useState(true);
  const [dimAtTarget, setDimAtTarget] = useState(false);

  indexRef.current = index;

  const finishTransition = useCallback(() => {
    isTransitioningRef.current = false;
    setIsTransitioning(false);
    setOutgoingCenterId(null);
    setSnapshot(null);
    setRevolvePhase("idle");
  }, []);

  const endTransition = useCallback(() => {
    const fadeTarget = pendingFadeTargetRef.current;
    if (fadeTarget !== null && fadeTarget !== indexRef.current) {
      pendingFadeTargetRef.current = null;
      pendingStepRef.current = 0;
      isTransitioningRef.current = true;
      setIsTransitioning(true);
      onIndexChange(fadeTarget);
      return;
    }

    const pending = pendingStepRef.current;
    if (pending !== 0) {
      const d = pending > 0 ? 1 : -1;
      pendingStepRef.current = pending - d;
      isTransitioningRef.current = true;
      setIsTransitioning(true);
      onIndexChange((indexRef.current + d + count) % count);
      return;
    }

    finishTransition();
  }, [count, onIndexChange, finishTransition]);

  useEffect(() => {
    isTransitioningRef.current = isTransitioning;
  }, [isTransitioning]);

  const requestIndex = useCallback(
    (target: number) => {
      if (count === 0) return;
      const next = ((target % count) + count) % count;
      if (next === indexRef.current) return;

      if (isTransitioningRef.current) {
        const mode = getTransitionMode(indexRef.current, next, count);
        if (mode === "fade") {
          pendingFadeTargetRef.current = next;
          pendingStepRef.current = 0;
          return;
        }
        let step = next - indexRef.current;
        if (step > count / 2) step -= count;
        if (step < -count / 2) step += count;
        if (step === 1 || step === -1) {
          requestedDirectionRef.current = step === 1 ? 1 : -1;
          pendingStepRef.current += step;
          pendingFadeTargetRef.current = null;
        } else {
          pendingFadeTargetRef.current = next;
          pendingStepRef.current = 0;
        }
        return;
      }

      const forward = (indexRef.current + 1) % count;
      requestedDirectionRef.current = next === forward ? 1 : -1;
      onIndexChange(next);
    },
    [count, onIndexChange]
  );

  const go = useCallback(
    (delta: number) => {
      if (count === 0) return;
      if (isTransitioningRef.current) {
        requestedDirectionRef.current = delta > 0 ? 1 : -1;
        pendingStepRef.current += delta;
        pendingFadeTargetRef.current = null;
        return;
      }
      requestedDirectionRef.current = delta > 0 ? 1 : -1;
      onIndexChange((indexRef.current + delta + count) % count);
    },
    [count, onIndexChange]
  );

  const handlePlaybackEnded = useCallback(() => {
    if (count > 1) go(1);
  }, [count, go]);

  useLayoutEffect(() => {
    const measure = () => {
      const centerEl = centerMeasureRef.current;
      if (!centerEl) return;
      const centerW = centerEl.offsetWidth;
      if (centerW <= 0) return;
      if (isExpandedCenter) {
        const peekAdjacentW =
          peekMeasureRef.current?.offsetWidth || EXPANDED_PEEK_MEASURE_WIDTH_PX;
        const peekOuterW =
          outerPeekMeasureRef.current?.offsetWidth || EXPANDED_OUTER_MEASURE_WIDTH_PX;
        setMetrics(expandedStripMetricsFromCenterWidth(centerW, peekAdjacentW, peekOuterW));
      } else {
        setMetrics(
          layoutMetricsFromCenterWidth(centerW, {
            stageGapPx: STAGE_GAP_PX,
          })
        );
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (centerMeasureRef.current) ro.observe(centerMeasureRef.current);
    if (isExpandedCenter && peekMeasureRef.current) {
      ro.observe(peekMeasureRef.current);
    }
    if (isExpandedCenter && outerPeekMeasureRef.current) {
      ro.observe(outerPeekMeasureRef.current);
    }
    const mq = window.matchMedia("(min-width: 640px)");
    const onMq = () => measure();
    mq.addEventListener("change", onMq);
    return () => {
      ro.disconnect();
      mq.removeEventListener("change", onMq);
    };
  }, [isExpandedCenter]);

  useLayoutEffect(() => {
    const prev = prevIndexRef.current;
    if (prev === index) return;

    const rawMode = getTransitionMode(prev, index, count);
    const mode: ActiveTransitionMode = rawMode === "revolve" ? "slide" : rawMode;
    setTransitionMode(mode);
    isTransitioningRef.current = true;
    setIsTransitioning(true);
    setOutgoingCenterId(items[prev]?.id ?? null);
    prevIndexRef.current = index;

    if (mode === "fade") {
      setSnapshot(null);
      setRevolvePhase("idle");
      setViewportOpacity(0);
      return;
    }

    const direction = requestedDirectionRef.current;
    const targetPhase = direction === 1 ? "toNext" : "toPrev";
    setAnimPrevIndex(prev);
    setSnapshot(isExpandedCenter ? quintetAt(items, prev) : teaserQuartetAt(items, prev));
    setIncomingAtEnter(true);
    setRevolvePhase("idle");
    const raf = requestAnimationFrame(() => {
      setRevolvePhase(targetPhase);
      setRevolveEpoch((e) => e + 1);
    });
    return () => cancelAnimationFrame(raf);
  }, [index, count, items, isExpandedCenter]);

  useEffect(() => {
    if (!isTransitioning) return;

    if (transitionMode === "fade") {
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => setViewportOpacity(1));
      });
      const timer = window.setTimeout(() => endTransition(), FADE_MS);
      return () => {
        cancelAnimationFrame(raf);
        window.clearTimeout(timer);
      };
    }

    if (revolvePhase === "toNext" || revolvePhase === "toPrev") {
      const durationMs = transitionMode === "slide" ? SLIDE_MS : REVOLVE_MS;
      const bufferMs = transitionMode === "slide" ? SLIDE_COMMIT_BUFFER_MS : 80;
      const timer = window.setTimeout(() => endTransition(), durationMs + bufferMs);
      return () => window.clearTimeout(timer);
    }
  }, [index, isTransitioning, transitionMode, revolvePhase, endTransition]);

  useEffect(() => {
    if (transitionMode === "fade") {
      setIncomingAtEnter(true);
      return;
    }
    if (revolvePhase === "idle") {
      setIncomingAtEnter(true);
      return;
    }
    if (revolvePhase === "toNext" || revolvePhase === "toPrev") {
      setIncomingAtEnter(true);
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => setIncomingAtEnter(false));
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [revolvePhase, transitionMode]);

  useEffect(() => {
    const isShiftingNow =
      revolvePhase !== "idle" &&
      (transitionMode === "revolve" || transitionMode === "slide");
    if (!isShiftingNow) {
      setDimAtTarget(false);
      return;
    }
    setDimAtTarget(false);
    const raf = requestAnimationFrame(() => {
      setDimAtTarget(true);
    });
    return () => cancelAnimationFrame(raf);
  }, [revolvePhase, transitionMode, revolveEpoch]);

  const viewportRef = useRef<HTMLDivElement>(null);
  const carouselSwipeEnabled = count > 1 && swipeEnabledProp;

  useHorizontalSwipe(viewportRef, {
    enabled: carouselSwipeEnabled,
    onSwipeLeft: () => go(1),
    onSwipeRight: () => go(-1),
  });

  const onViewportKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!carouselSwipeEnabled) return;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      go(-1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      go(1);
    }
  };

  if (count === 0) return null;

  const defaultStageMinHeight = isExpandedCenter
    ? "min-h-[min(88vh,900px)]"
    : "min-h-[min(42vh,400px)]";
  const stageMinHeight = stageMinHeightProp ?? defaultStageMinHeight;

  if (count === 1) {
    const only = items[0]!;
    return (
      <div
        ref={viewportRef}
        role="region"
        aria-roledescription="carousel"
        aria-label={t("home.promoSectionTitle")}
        className={`${viewportClassName ?? HOME_HERO_PEEK_VIEWPORT_CLASS} touch-pan-y select-none outline-none`}
      >
        <div
          className={`relative mx-auto ${
            isExpandedCenter ? EXPANDED_VIEWER_CENTER_FRAME_CLASS : HOME_HERO_TEASER_FRAME_CLASS
          }`}
        >
          {isExpandedCenter ? (
            <PromoShortPlayer
              item={only}
              isActive
              playbackEnabled={!isTransitioning}
              expandedChrome
              layout={layout}
              compact={compact}
              scrollExpand
              scrollRootRef={viewportRef}
              loop={false}
              className="mx-auto h-full w-full"
            />
          ) : (
            <PromoShortPlayer
              item={only}
              isActive
              playbackEnabled={!isTransitioning}
              variant="teaser"
              playerSize={playerSize}
              peekSide={false}
              layout={layout}
              compact={compact}
              scrollExpand={false}
              loop={false}
              teaserCenterAction="expand"
              onTeaserExpandRequest={onTeaserExpandRequest}
              className="mx-auto h-full w-full"
            />
          )}
        </div>
      </div>
    );
  }

  const liveQuartet = teaserQuartetAt(items, index);
  const liveQuintet = quintetAt(items, index);
  const displayQuartet =
    snapshot && isTeaserQuartetSnapshot(snapshot) ? snapshot : liveQuartet;
  const displayQuintet =
    snapshot && isQuintetSnapshot(snapshot) ? snapshot : liveQuintet;
  const stripMetrics =
    isExpandedCenter && "offsetOuter" in metrics ? metrics : null;
  const animatingShift =
    revolvePhase !== "idle" &&
    (transitionMode === "revolve" || transitionMode === "slide");
  const animatingRevolve = transitionMode === "revolve" && revolvePhase !== "idle";
  const transitionClass = animatingShift
    ? transitionMode === "slide"
      ? "transition-[transform,opacity] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
      : `transition-[transform,opacity] duration-500 ease-in-out motion-reduce:transition-none`
    : "motion-reduce:transition-none";
  const slideTransitionStyle =
    animatingShift && transitionMode === "slide"
      ? {
          transitionDuration: `${SLIDE_MS}ms`,
          transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
        }
      : undefined;

  const stageOpacityClass =
    transitionMode === "fade"
      ? "transition-opacity duration-300 ease-in-out motion-reduce:transition-none"
      : "";

  const showIncoming =
    (transitionMode === "revolve" || transitionMode === "slide") &&
    (revolvePhase === "toNext" || revolvePhase === "toPrev");
  const incomingMinCount = isExpandedCenter ? 5 : count >= 4 ? 4 : 3;
  const wrapCandidate =
    showIncoming && count >= incomingMinCount
      ? isExpandedCenter
        ? expandedIncomingItemAt(items, animPrevIndex, revolvePhase)
        : incomingItemAt(items, animPrevIndex, revolvePhase, count)
      : null;
  const incomingItem =
    wrapCandidate &&
    !(
      isExpandedCenter
        ? (revolvePhase === "toNext" && wrapCandidate.id === displayQuintet.farRight.id) ||
          (revolvePhase === "toPrev" && wrapCandidate.id === displayQuintet.farLeft.id)
        : (revolvePhase === "toNext" && wrapCandidate.id === displayQuartet.farLeft.id) ||
          (revolvePhase === "toPrev" && wrapCandidate.id === displayQuartet.right.id)
    )
      ? wrapCandidate
      : null;
  const incomingStyle =
    incomingItem && showIncoming
      ? stripMetrics
        ? expandedIncomingSlotTransform(revolvePhase, incomingAtEnter, stripMetrics)
        : incomingSlotTransform(revolvePhase, incomingAtEnter, metrics, count)
      : null;
  const keepExpandedEdgeVisibleDuringShift =
    isExpandedCenter &&
    showIncoming &&
    (revolvePhase === "toNext" || revolvePhase === "toPrev");
  const keepTeaserEdgeVisibleDuringShift =
    !isExpandedCenter &&
    count >= 4 &&
    showIncoming &&
    (revolvePhase === "toNext" || revolvePhase === "toPrev");

  const liveCenterId = items[index]!.id;
  const navOffsetX = stripMetrics?.offsetAdjacent ?? metrics.offsetX;
  const stageMetricsStyle = stripMetrics
    ? {
        minWidth: `${Math.round(stripMetrics.offsetOuter * 2 + 48)}px`,
        ["--carousel-offset-x" as string]: `${stripMetrics.offsetAdjacent}px`,
        ["--carousel-peek-scale" as string]: String(stripMetrics.peekScale),
        ["--carousel-back-scale" as string]: String(
          stripMetrics.peekScale * CAROUSEL_BACK_SCALE_RATIO
        ),
      }
    : {
        minWidth: `${Math.round(
          (count >= 4 ? metrics.offsetFarLeft : metrics.offsetX) * 2 + ENTER_GAP_PX + 48
        )}px`,
        perspective: "1000px",
        transformStyle: "preserve-3d" as const,
        ["--carousel-offset-x" as string]: `${metrics.offsetX}px`,
        ["--carousel-peek-scale" as string]: String(metrics.peekScale),
        ["--carousel-back-scale" as string]: String(metrics.farScale),
      };

  return (
    <div
      ref={viewportRef}
      role="region"
      aria-roledescription="carousel"
      aria-label={t("home.promoSectionTitle")}
      tabIndex={carouselSwipeEnabled ? 0 : undefined}
      onKeyDown={onViewportKeyDown}
      className={`${viewportClassName ?? HOME_HERO_PEEK_VIEWPORT_CLASS} touch-pan-y select-none outline-none`}
    >
      {/* layout measure — teaser 프레임 하나만 */}
      <div className="pointer-events-none absolute opacity-0 -z-50" aria-hidden>
        <div ref={centerMeasureRef} className={carouselFrameClass} />
        {isExpandedCenter ? (
          <>
            <div ref={peekMeasureRef} className={EXPANDED_VIEWER_PEEK_FRAME_CLASS} />
            <div ref={outerPeekMeasureRef} className={EXPANDED_VIEWER_OUTER_PEEK_FRAME_CLASS} />
          </>
        ) : null}
      </div>

      <div
        className={`relative mx-auto ${isExpandedCenter ? "overflow-visible" : ""} ${stageMinHeight} ${stageOpacityClass}`}
        style={{ opacity: viewportOpacity }}
        aria-live="polite"
      >
        <div
          ref={stageRef}
          className={`relative mx-auto overflow-visible ${isExpandedCenter ? "px-0" : "px-2"} flex items-center justify-center ${stageMinHeight}`}
          style={stageMetricsStyle}
        >
          {(() => {
            const backSlots: ReactNode[] = [];
            const frontSlots: ReactNode[] = [];

            items.forEach((item, itemIdx) => {
              const placement =
                stripMetrics
                  ? placementForExpandedItem(
                      item.id,
                      displayQuintet,
                      count,
                      incomingItem,
                      incomingStyle,
                      revolvePhase,
                      stripMetrics,
                      carouselFrameClass,
                      keepExpandedEdgeVisibleDuringShift
                    )
                  : placementForTeaserItem(
                      item.id,
                      displayQuartet,
                      count,
                      incomingItem,
                      incomingStyle,
                      revolvePhase,
                      metrics,
                      carouselFrameClass,
                      keepTeaserEdgeVisibleDuringShift
                    );
              const warmCenter =
                !snapshot &&
                (isExpandedCenter
                  ? shouldWarmExpandedStripItem(itemIdx, index, count)
                  : shouldWarmTeaserStripItem(itemIdx, index, count));
              if (!placement.visible && !warmCenter) return;

              const isTargetCenter = item.id === liveCenterId;
              const isLiveCenter = !snapshot && isTargetCenter;
              const isPromoting =
                animatingShift &&
                (isExpandedCenter
                  ? (revolvePhase === "toNext" && item.id === displayQuintet.right.id) ||
                    (revolvePhase === "toPrev" && item.id === displayQuintet.left.id)
                  : revolvePhase === "toNext"
                    ? item.id === displayQuartet.right.id
                    : item.id === displayQuartet.left.id ||
                      (count >= 4 && item.id === displayQuartet.farLeft.id));
              const isOutgoingCenter = Boolean(
                snapshot && outgoingCenterId && item.id === outgoingCenterId
              );
              const keepsVideoDuringShift =
                animatingShift &&
                (placement.isCenter || isPromoting || isOutgoingCenter);
              const showAsCenter =
                keepsVideoDuringShift ||
                (placement.isCenter && !isOutgoingCenter && !animatingShift) ||
                (warmCenter && !placement.visible) ||
                (isLiveCenter && !snapshot);
              const preserveCenterFrame = Boolean(
                showAsCenter &&
                snapshot &&
                (item.id === liveCenterId || item.id === outgoingCenterId)
              );
              const slotPlaybackEnabled = showAsCenter
                ? (isLiveCenter || isPromoting) && !isTransitioning
                : false;
              const ariaLiveCenter = isLiveCenter || isPromoting;
              const isWrapArc =
                isExpandedCenter &&
                transitionMode === "revolve" &&
                animatingRevolve &&
                placement.visible &&
                ((revolvePhase === "toNext" && placement.role === "left") ||
                  (revolvePhase === "toPrev" && placement.role === "right"));
              const wrapArcClass = isWrapArc
                ? revolvePhase === "toNext"
                  ? "animate-carousel-wrap-to-next"
                  : "animate-carousel-wrap-to-prev"
                : "";
              const slotMotionClass = isWrapArc ? wrapArcClass : transitionClass;
              const slotCenteringClass = isWrapArc ? "" : "-translate-y-1/2";
              const baseDimLevel = isExpandedCenter
                ? expandedRoleDimLevel(placement.role)
                : teaserRoleDimLevel(placement.role);
              const targetRole = animatingShift
                ? isExpandedCenter
                  ? shiftedExpandedRole(placement.role, revolvePhase)
                  : shiftedTeaserRole(placement.role, revolvePhase)
                : placement.role;
              const targetDimLevel = isExpandedCenter
                ? expandedRoleDimLevel(targetRole)
                : teaserRoleDimLevel(targetRole);
              const animatedDimLevel = animatingShift
                ? dimAtTarget
                  ? targetDimLevel
                  : baseDimLevel
                : null;
              const sideDimLevel = (baseDimLevel ?? "default") as PromoShortPeekDimLevel;
              const showChrome = placement.role === "center" && !isOutgoingCenter;
              const isVisiblePreloadSlot = placement.visible && !showAsCenter;
              const slotVideoPreload = (() => {
                if (showAsCenter) {
                  return isLiveCenter || isPromoting ? "auto" : "metadata";
                }
                if (!placement.visible) return "metadata";
                if (!isExpandedCenter) return "auto";
                if (placement.role === "farLeft" || placement.role === "farRight") {
                  return VISIBLE_PRELOAD_MODE === "allAuto" ? "auto" : "metadata";
                }
                return "auto";
              })();
              const useExpandedScaleSizing = Boolean(isExpandedCenter && stripMetrics);
              const slotFrameClass = placement.visible
                ? isWrapArc
                  ? carouselWrapFrameClass
                  : useExpandedScaleSizing
                    ? carouselFrameClass
                    : placement.frameClass
                : carouselFrameClass;

              const slotEl = (
                <div
                  key={isWrapArc ? `${item.id}-rev-${revolveEpoch}` : item.id}
                  className={`absolute top-1/2 left-1/2 ${slotCenteringClass} will-change-transform ${slotMotionClass} ${slotFrameClass}`}
                  style={{
                    transform: placement.visible
                      ? isWrapArc
                        ? undefined
                        : `translate(-50%, -50%) ${placement.transform}`
                      : "translate(-50%, -50%) scale(0.85)",
                    opacity: placement.visible ? (isWrapArc ? 1 : placement.opacity) : 0,
                    zIndex: placement.visible ? placement.zIndex : 0,
                    pointerEvents: placement.visible ? undefined : "none",
                    ...slideTransitionStyle,
                  }}
                  aria-hidden={placement.visible ? !ariaLiveCenter : true}
                >
                  {showAsCenter || isVisiblePreloadSlot ? (
                    isExpandedCenter ? (
                      <PromoShortPlayer
                        item={item}
                        isActive={isLiveCenter}
                        playbackEnabled={slotPlaybackEnabled}
                        videoPreload={slotVideoPreload}
                        preserveFrame={preserveCenterFrame}
                        expandedEmbed
                        showChrome={showChrome}
                        forcePortraitFrame
                        carouselAdjacentEmbed={isVisiblePreloadSlot}
                        carouselAdjacentDimLevel={sideDimLevel}
                        transitionDimLevel={animatedDimLevel}
                        layout={layout}
                        compact={compact}
                        scrollExpand={showChrome}
                        scrollRootRef={showChrome ? viewportRef : undefined}
                        loop={false}
                        onPlaybackEnded={
                          isLiveCenter && count > 1 ? handlePlaybackEnded : undefined
                        }
                        className="h-full w-full"
                      />
                    ) : (
                      <PromoShortPlayer
                        item={item}
                        isActive={isLiveCenter}
                        playbackEnabled={slotPlaybackEnabled}
                        preserveFrame={preserveCenterFrame}
                        heroCarouselEmbed
                        showChrome={showChrome}
                        forcePortraitFrame
                        carouselAdjacentEmbed={isVisiblePreloadSlot}
                        carouselAdjacentDimLevel={sideDimLevel}
                        transitionDimLevel={animatedDimLevel}
                        videoPreload={slotVideoPreload}
                        variant="teaser"
                        playerSize={playerSize}
                        peekSide={false}
                        layout={layout}
                        compact={compact}
                        scrollExpand={false}
                        loop={false}
                        teaserCenterAction="expand"
                        onTeaserExpandRequest={onTeaserExpandRequest}
                        onPlaybackEnded={
                          isLiveCenter && count > 1 ? handlePlaybackEnded : undefined
                        }
                        className="h-full w-full"
                      />
                    )
                  ) : (
                    <PromoShortPeekPreview
                      item={item}
                      compactShell
                      dimOverlay
                      dimLevel={animatedDimLevel ?? (isWrapArc ? "strong" : sideDimLevel)}
                    />
                  )}
                  {carouselSwipeEnabled && placement.visible && placement.role === "left" && !isWrapArc && (
                    <div
                      role="presentation"
                      data-carousel-nav
                      className={PEEK_TAP_LAYER_LEFT}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => go(-1)}
                    />
                  )}
                  {carouselSwipeEnabled && placement.visible && placement.role === "right" && !isWrapArc && (
                    <div
                      role="presentation"
                      data-carousel-nav
                      className={PEEK_TAP_LAYER_RIGHT}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => go(1)}
                    />
                  )}
                </div>
              );

              if (isWrapArc) backSlots.push(slotEl);
              else frontSlots.push(slotEl);
            });

            return (
              <>
                {backSlots.length > 0 ? (
                  <div className={CAROUSEL_BACK_LAYER_CLASS}>{backSlots}</div>
                ) : null}
                <div className={CAROUSEL_FRONT_LAYER_CLASS}>{frontSlots}</div>
              </>
            );
          })()}
          {carouselSwipeEnabled ? (
            <div className="pointer-events-none absolute inset-0 z-[60]">
              <button
                type="button"
                data-carousel-nav
                className={FIXED_CAROUSEL_ARROW_CLASS}
                style={{
                  left: `calc(50% - ${navOffsetX}px + ${metrics.peekInnerArrowAnchorPx}px)`,
                  transform: "translate(-100%, -50%)",
                }}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => go(-1)}
                aria-label={t("home.promoPrev")}
              >
                ‹
              </button>
              <button
                type="button"
                data-carousel-nav
                className={FIXED_CAROUSEL_ARROW_CLASS}
                style={{
                  left: `calc(50% + ${navOffsetX}px - ${metrics.peekInnerArrowAnchorPx}px)`,
                  transform: "translate(0, -50%)",
                }}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => go(1)}
                aria-label={t("home.promoNext")}
              >
                ›
              </button>
            </div>
          ) : null}
        </div>

        {count > 1 && (
          <div
            className="absolute top-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 pointer-events-auto"
            aria-label={`${current?.title ?? ""} ${index + 1}/${count}`}
          >
            {items.map((item, i) => (
              <button
                key={item.id}
                type="button"
                onClick={() => requestIndex(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? "w-8 bg-xiio-accent" : "w-1.5 bg-white/25 hover:bg-white/40"
                }`}
                aria-label={`${item.title} ${i + 1}/${count}`}
                aria-current={i === index ? "true" : undefined}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
