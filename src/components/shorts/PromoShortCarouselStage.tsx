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
  getRevolveDirection,
  getTransitionMode,
} from "@/components/shorts/promoCarouselTransition";
import {
  circularDistance,
  shouldWarmExpandedStripItem,
} from "@/components/shorts/promoCarouselUtils";
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

type Triplet = { left: PromoShort; center: PromoShort; right: PromoShort };

type Quintet = {
  farLeft: PromoShort;
  left: PromoShort;
  center: PromoShort;
  right: PromoShort;
  farRight: PromoShort;
};

type CarouselSnapshot = Triplet | Quintet;

type RevolvePhase = "idle" | "toNext" | "toPrev";
type ActiveTransitionMode = "revolve" | "fade" | "slide";

type SlotRole = "left" | "center" | "right" | "incoming";
type ExpandedStripRole = "farLeft" | "left" | "center" | "right" | "farRight" | "incoming";
type PlacementRole = SlotRole | ExpandedStripRole;

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
  return "farLeft" in s;
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
const SLIDE_OFFSET_RATIO = 0.55;
const SLIDE_ENTER_EXTRA_PX = 20;
const SLIDE_EDGE_FADE = 0.08;
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
  const offsetX = centerW / 2 + stageGapPx + peekVisualW / 2;
  /** 슬롯 scale 적용 후 피크 안쪽 가장자리(화살표 앵커) */
  const peekInnerArrowAnchorPx = options.peekVisualWidthPx
    ? peekVisualW / 2 - NAV_ARROW_INSET_PX
    : (centerW / 2 - NAV_ARROW_INSET_PX) * peekScale;
  return {
    centerW,
    offsetX,
    peekScale,
    peekInnerArrowAnchorPx,
  };
}

type LayoutMetrics = {
  centerW: number;
  offsetX: number;
  peekScale: number;
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
  return {
    centerW,
    offsetX: offsetAdjacent,
    offsetAdjacent,
    offsetOuter,
    peekScale,
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
  "flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center p-0 bg-transparent border-0 text-[2.75rem] sm:text-[3.25rem] font-light leading-none text-white hover:text-white/80 transition pointer-events-auto focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)] [text-shadow:0_1px_3px_rgba(0,0,0,0.95),0_0_10px_rgba(0,0,0,0.85),0_0_20px_rgba(0,0,0,0.55)] [-webkit-text-stroke:0.5px_rgba(0,0,0,0.35)]";
/** top-1/2 + translate Y만 공통 — X는 피크 right-2/left-2 와 동일 앵커 */
const FIXED_CAROUSEL_ARROW_CLASS = `absolute top-1/2 ${PEEK_CAROUSEL_ARROW_BASE}`;
const PEEK_TAP_LAYER_BASE =
  "absolute inset-y-0 z-40 w-[40%] cursor-pointer rounded-[14px] bg-transparent";
const PEEK_TAP_LAYER_LEFT = `${PEEK_TAP_LAYER_BASE} left-0`;
const PEEK_TAP_LAYER_RIGHT = `${PEEK_TAP_LAYER_BASE} right-0`;

function tripletAt(items: PromoShort[], centerIndex: number): Triplet {
  const n = items.length;
  return {
    left: items[(centerIndex - 1 + n) % n]!,
    center: items[centerIndex]!,
    right: items[(centerIndex + 1) % n]!,
  };
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

function expandedStripSlotTransform(
  role: ExpandedStripRole,
  phase: RevolvePhase,
  metrics: ExpandedStripMetrics
): { transform: string; opacity: number; zIndex: number } {
  const { offsetAdjacent, offsetOuter, centerW, peekAdjacentW, peekOuterW } = metrics;
  const adjacentScale = Math.min(1, Math.max(0.7, peekAdjacentW / Math.max(centerW, 1)));
  const outerScaleBase = Math.min(1, Math.max(0.55, peekOuterW / Math.max(centerW, 1)));
  const outerScale = outerScaleBase * EXPANDED_OUTER_PEEK_SCALE;

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
          opacity: SLIDE_EDGE_FADE,
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
          opacity: SLIDE_EDGE_FADE,
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
  const { offsetOuter, centerW, peekOuterW } = metrics;
  const outerScaleBase = Math.min(1, Math.max(0.55, peekOuterW / Math.max(centerW, 1)));
  const outerScale = outerScaleBase * EXPANDED_OUTER_PEEK_SCALE;
  const enterX = offsetOuter + SLIDE_ENTER_EXTRA_PX;

  if (phase === "toNext") {
    if (atEnter) {
      return {
        transform: `translateX(${enterX}px) scale(${outerScale})`,
        opacity: SLIDE_EDGE_FADE,
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
      opacity: SLIDE_EDGE_FADE,
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
  role: SlotRole,
  phase: RevolvePhase,
  metrics: LayoutMetrics,
  transitionMode: ActiveTransitionMode
): { transform: string; opacity: number; zIndex: number } {
  const { offsetX, peekScale } = metrics;

  if (transitionMode === "slide") {
    const slideOffset = Math.round(offsetX * SLIDE_OFFSET_RATIO);
    if (phase === "idle") {
      if (role === "left") {
        return {
          transform: `translateX(${-slideOffset}px) scale(${peekScale})`,
          opacity: 1,
          zIndex: 15,
        };
      }
      if (role === "right") {
        return {
          transform: `translateX(${slideOffset}px) scale(${peekScale})`,
          opacity: 1,
          zIndex: 15,
        };
      }
      return { transform: "translateX(0) scale(1)", opacity: 1, zIndex: 25 };
    }

    if (phase === "toNext") {
      if (role === "left") {
        return {
          transform: `translateX(${-slideOffset}px) scale(${peekScale})`,
          opacity: SLIDE_EDGE_FADE,
          zIndex: 1,
        };
      }
      if (role === "center") {
        return {
          transform: `translateX(${-slideOffset}px) scale(${peekScale})`,
          opacity: 1,
          zIndex: 20,
        };
      }
      return { transform: "translateX(0) scale(1)", opacity: 1, zIndex: 25 };
    }

    if (role === "right") {
      return {
        transform: `translateX(${slideOffset}px) scale(${peekScale})`,
        opacity: SLIDE_EDGE_FADE,
        zIndex: 1,
      };
    }
    if (role === "center") {
      return {
        transform: `translateX(${slideOffset}px) scale(${peekScale})`,
        opacity: 1,
        zIndex: 20,
      };
    }
    return { transform: "translateX(0) scale(1)", opacity: 1, zIndex: 25 };
  }

  if (phase === "idle") {
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
    if (role === "left") {
      return {
        transform: `translateX(${offsetX}px) scale(${peekScale})`,
        opacity: 1,
        zIndex: 1,
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

  if (role === "right") {
    return {
      transform: `translateX(${-offsetX}px) scale(${peekScale})`,
      opacity: 1,
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
  return { transform: "translateX(0) scale(1)", opacity: 1, zIndex: 25 };
}

function incomingSlotTransform(
  phase: "toNext" | "toPrev",
  atEnter: boolean,
  metrics: LayoutMetrics,
  transitionMode: ActiveTransitionMode
): { transform: string; opacity: number; zIndex: number } {
  const { offsetX, peekScale } = metrics;
  const slideOffset = Math.round(offsetX * SLIDE_OFFSET_RATIO);
  const enterX =
    transitionMode === "slide"
      ? slideOffset + SLIDE_ENTER_EXTRA_PX
      : offsetX + ENTER_GAP_PX;

  if (phase === "toNext") {
    if (atEnter) {
      return {
        transform: `translateX(${enterX}px) scale(${peekScale})`,
        opacity: transitionMode === "slide" ? SLIDE_EDGE_FADE : 1,
        zIndex: transitionMode === "slide" ? 15 : 4,
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
      transform: `translateX(${-enterX}px) scale(${peekScale})`,
      opacity: transitionMode === "slide" ? SLIDE_EDGE_FADE : 1,
      zIndex: transitionMode === "slide" ? 15 : 4,
    };
  }
  return {
    transform: `translateX(${-offsetX}px) scale(${peekScale})`,
    opacity: 1,
    zIndex: 15,
  };
}

function incomingItemAt(items: PromoShort[], centerIndex: number, phase: "toNext" | "toPrev"): PromoShort {
  const n = items.length;
  if (phase === "toNext") return items[(centerIndex + 2) % n]!;
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

function placementForItem(
  itemId: string,
  displayTriplet: Triplet,
  incomingItem: PromoShort | null,
  incomingStyle: { transform: string; opacity: number; zIndex: number } | null,
  revolvePhase: RevolvePhase,
  transitionMode: ActiveTransitionMode,
  metrics: LayoutMetrics,
  slotFrameClass: string
): ItemPlacement {
  if (incomingItem && incomingStyle && incomingItem.id === itemId) {
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
  if (displayTriplet.left.id === itemId) {
    const s = slotTransform("left", revolvePhase, metrics, transitionMode);
    return {
      visible: true,
      role: "left",
      transform: s.transform,
      opacity: s.opacity,
      zIndex: s.zIndex,
      frameClass: slotFrameClass,
      isCenter: false,
    };
  }
  if (displayTriplet.center.id === itemId) {
    const s = slotTransform("center", revolvePhase, metrics, transitionMode);
    return {
      visible: true,
      role: "center",
      transform: s.transform,
      opacity: s.opacity,
      zIndex: s.zIndex,
      frameClass: slotFrameClass,
      isCenter: true,
    };
  }
  if (displayTriplet.right.id === itemId) {
    const s = slotTransform("right", revolvePhase, metrics, transitionMode);
    return {
      visible: true,
      role: "right",
      transform: s.transform,
      opacity: s.opacity,
      zIndex: s.zIndex,
      frameClass: slotFrameClass,
      isCenter: false,
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
  slotFrameClass: string
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
    if (item.id !== itemId || !visibleRoles.has(role)) continue;
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
  const expandedPeekFrameClass = `${EXPANDED_VIEWER_PEEK_FRAME_CLASS} ${HERO_CAROUSEL_ROUNDED_CLASS}`;
  const expandedOuterPeekFrameClass = `${EXPANDED_VIEWER_OUTER_PEEK_FRAME_CLASS} ${HERO_CAROUSEL_ROUNDED_CLASS}`;
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
    const mode: ActiveTransitionMode =
      isExpandedCenter && rawMode === "revolve" ? "slide" : rawMode;
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

    const direction = isExpandedCenter
      ? requestedDirectionRef.current
      : getRevolveDirection(prev, index, count);
    const targetPhase = direction === 1 ? "toNext" : "toPrev";
    setAnimPrevIndex(prev);
    setSnapshot(isExpandedCenter ? quintetAt(items, prev) : tripletAt(items, prev));
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
      const timer = window.setTimeout(() => endTransition(), durationMs + 80);
      return () => window.clearTimeout(timer);
    }
  }, [index, isTransitioning, transitionMode, revolvePhase, endTransition]);

  useEffect(() => {
    if (transitionMode !== "revolve") {
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

  const liveTriplet = tripletAt(items, index);
  const liveQuintet = quintetAt(items, index);
  const displayTriplet =
    snapshot && !isQuintetSnapshot(snapshot) ? snapshot : liveTriplet;
  const displayQuintet =
    snapshot && isQuintetSnapshot(snapshot) ? snapshot : liveQuintet;
  const stripMetrics =
    isExpandedCenter && "offsetOuter" in metrics ? metrics : null;
  const animatingShift =
    revolvePhase !== "idle" &&
    (transitionMode === "revolve" || transitionMode === "slide");
  const animatingRevolve = transitionMode === "revolve" && revolvePhase !== "idle";
  const transitionClass = animatingShift
    ? isExpandedCenter && transitionMode === "slide"
      ? "transition-[transform,opacity] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
      : `transition-[transform,opacity] duration-500 ${
          transitionMode === "slide"
            ? "ease-[cubic-bezier(0.22,1,0.36,1)]"
            : "ease-in-out"
        } motion-reduce:transition-none`
    : "motion-reduce:transition-none";
  const expandedSlideTransitionStyle =
    animatingShift && isExpandedCenter && transitionMode === "slide"
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
  const incomingMinCount = isExpandedCenter ? 5 : 3;
  const wrapCandidate =
    showIncoming && count >= incomingMinCount
      ? isExpandedCenter
        ? expandedIncomingItemAt(items, animPrevIndex, revolvePhase)
        : incomingItemAt(items, animPrevIndex, revolvePhase)
      : null;
  const incomingItem =
    wrapCandidate &&
    !(
      isExpandedCenter
        ? (revolvePhase === "toNext" && wrapCandidate.id === displayQuintet.farRight.id) ||
          (revolvePhase === "toPrev" && wrapCandidate.id === displayQuintet.farLeft.id)
        : (revolvePhase === "toNext" && wrapCandidate.id === displayTriplet.left.id) ||
          (revolvePhase === "toPrev" && wrapCandidate.id === displayTriplet.right.id)
    )
      ? wrapCandidate
      : null;
  const incomingStyle =
    incomingItem && showIncoming
      ? stripMetrics
        ? expandedIncomingSlotTransform(revolvePhase, incomingAtEnter, stripMetrics)
        : incomingSlotTransform(revolvePhase, incomingAtEnter, metrics, transitionMode)
      : null;

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
        minWidth: `${Math.round(metrics.offsetX * 2 + ENTER_GAP_PX + 48)}px`,
        perspective: "1000px",
        transformStyle: "preserve-3d" as const,
        ["--carousel-offset-x" as string]: `${metrics.offsetX}px`,
        ["--carousel-peek-scale" as string]: String(metrics.peekScale),
        ["--carousel-back-scale" as string]: String(metrics.peekScale * CAROUSEL_BACK_SCALE_RATIO),
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
                      carouselFrameClass
                    )
                  : placementForItem(
                      item.id,
                      displayTriplet,
                      incomingItem,
                      incomingStyle,
                      revolvePhase,
                      transitionMode,
                      metrics,
                      carouselFrameClass
                    );
              const warmCenter =
                !snapshot &&
                (isExpandedCenter
                  ? shouldWarmExpandedStripItem(itemIdx, index, count)
                  : circularDistance(itemIdx, index, count) <= 1);
              if (!placement.visible && !warmCenter) return;

              const isTargetCenter = item.id === liveCenterId;
              const isLiveCenter = !snapshot && isTargetCenter;
              const isPromoting =
                animatingShift &&
                (isExpandedCenter
                  ? (revolvePhase === "toNext" && item.id === displayQuintet.right.id) ||
                    (revolvePhase === "toPrev" && item.id === displayQuintet.left.id)
                  : (revolvePhase === "toNext" && item.id === displayTriplet.right.id) ||
                    (revolvePhase === "toPrev" && item.id === displayTriplet.left.id));
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
              const isOuterStripRole =
                placement.role === "farLeft" ||
                placement.role === "farRight" ||
                placement.role === "incoming";
              const isAdjacentStripRole =
                placement.role === "left" || placement.role === "right";
              const isVisibleSide = placement.visible && placement.role !== "center";
              const sideDimLevel =
                isExpandedCenter && isOuterStripRole ? "expandedOuter" : isExpandedCenter ? "expandedSide" : "default";
              const immediateDimLevel =
                animatingShift && (isVisibleSide || isOutgoingCenter) ? sideDimLevel : null;
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
              const expandedIdleFrameClass =
                isExpandedCenter && isOuterStripRole
                  ? expandedOuterPeekFrameClass
                  : isExpandedCenter && (isAdjacentStripRole || !showAsCenter)
                    ? expandedPeekFrameClass
                    : placement.frameClass;
              const freezeCenterFrameDuringShift =
                isExpandedCenter && animatingShift && (showAsCenter || isOutgoingCenter);
              const slotFrameClass = placement.visible
                ? isWrapArc
                  ? carouselWrapFrameClass
                  : freezeCenterFrameDuringShift
                    ? carouselFrameClass
                    : expandedIdleFrameClass
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
                    ...expandedSlideTransitionStyle,
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
                        expandedChrome={showChrome}
                        carouselAdjacentEmbed={isVisiblePreloadSlot}
                        carouselAdjacentDimLevel={sideDimLevel}
                        transitionDimLevel={immediateDimLevel}
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
                        carouselAdjacentEmbed={isVisiblePreloadSlot}
                        carouselAdjacentDimLevel={sideDimLevel}
                        transitionDimLevel={immediateDimLevel}
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
                  ) : null}
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
