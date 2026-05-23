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
import { circularDistance } from "@/components/shorts/promoCarouselUtils";
import PromoShortPeekPreview from "@/components/shorts/PromoShortPeekPreview";
import PromoShortPlayer, {
  type PromoShortLayout,
  type PromoShortPlayerSize,
  HOME_HERO_PEEK_VIEWPORT_CLASS,
  HOME_HERO_TEASER_FRAME_CLASS,
} from "@/components/shorts/PromoShortPlayer";
import { useTranslations } from "@/context/LocaleContext";
import type { PromoShort } from "@/types/promoShort";

type Triplet = { left: PromoShort; center: PromoShort; right: PromoShort };

type RevolvePhase = "idle" | "toNext" | "toPrev";

type SlotRole = "left" | "center" | "right" | "incoming";

const ENTER_GAP_PX = 100;
const STAGE_GAP_PX = 4;
/** 피크 시각 너비 / teaser 프레임 (HOME_HERO_PEEK_SIDE 160|180 vs teaser 200|236) */
const PEEK_SCALE_SM = 180 / 236;
const PEEK_SCALE_DEFAULT = 160 / 200;
const HERO_CAROUSEL_ROUNDED_CLASS = "rounded-2xl overflow-hidden";
const HERO_CAROUSEL_WRAP_ROUNDED_CLASS = "rounded-2xl overflow-hidden";
const CAROUSEL_BACK_LAYER_CLASS = "absolute inset-0 z-[1] pointer-events-none [&>*]:pointer-events-auto";
const CAROUSEL_FRONT_LAYER_CLASS = "absolute inset-0 z-[10]";
const HERO_CAROUSEL_FRAME_CLASS = `${HOME_HERO_TEASER_FRAME_CLASS} ${HERO_CAROUSEL_ROUNDED_CLASS}`;
const HERO_CAROUSEL_WRAP_FRAME_CLASS = `${HOME_HERO_TEASER_FRAME_CLASS} ${HERO_CAROUSEL_WRAP_ROUNDED_CLASS}`;
const CAROUSEL_BACK_SCALE_RATIO = 0.52;

function peekScaleRatio(): number {
  if (typeof window === "undefined") return PEEK_SCALE_DEFAULT;
  return window.matchMedia("(min-width: 640px)").matches ? PEEK_SCALE_SM : PEEK_SCALE_DEFAULT;
}

function layoutMetricsFromCenterWidth(centerW: number): LayoutMetrics {
  const peekScale = peekScaleRatio();
  const peekVisualW = centerW * peekScale;
  return {
    offsetX: centerW / 2 + STAGE_GAP_PX + peekVisualW / 2,
    peekScale,
  };
}

type LayoutMetrics = {
  offsetX: number;
  peekScale: number;
};

type Props = {
  items: PromoShort[];
  index: number;
  onIndexChange: (index: number) => void;
  playerSize?: PromoShortPlayerSize;
  compact?: boolean;
  layout?: PromoShortLayout;
  viewportClassName?: string;
};

const PEEK_CAROUSEL_ARROW_BASE =
  "flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center p-0 bg-transparent border-0 shadow-none text-[2.75rem] sm:text-[3.25rem] font-light leading-none text-white hover:text-white/80 transition pointer-events-auto focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent";
const PEEK_ARROW_ON_LEFT_PEEK = `absolute right-2 top-1/2 -translate-y-1/2 z-50 ${PEEK_CAROUSEL_ARROW_BASE}`;
const PEEK_ARROW_ON_RIGHT_PEEK = `absolute left-2 top-1/2 -translate-y-1/2 z-50 ${PEEK_CAROUSEL_ARROW_BASE}`;
const PEEK_TAP_LAYER =
  "absolute inset-0 z-40 cursor-pointer rounded-2xl bg-transparent";

function tripletAt(items: PromoShort[], centerIndex: number): Triplet {
  const n = items.length;
  return {
    left: items[(centerIndex - 1 + n) % n]!,
    center: items[centerIndex]!,
    right: items[(centerIndex + 1) % n]!,
  };
}

function slotTransform(
  role: SlotRole,
  phase: RevolvePhase,
  metrics: LayoutMetrics
): { transform: string; opacity: number; zIndex: number } {
  const { offsetX, peekScale } = metrics;

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
    return { transform: "translateX(0) scale(1)", opacity: 1, zIndex: 10 };
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
  metrics: LayoutMetrics
): { transform: string; opacity: number; zIndex: number } {
  const { offsetX, peekScale } = metrics;
  const enterX = offsetX + ENTER_GAP_PX;

  if (phase === "toNext") {
    if (atEnter) {
      return {
        transform: `translateX(${enterX}px) scale(${peekScale})`,
        opacity: 1,
        zIndex: 4,
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
      opacity: 1,
      zIndex: 4,
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
  role?: SlotRole;
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
  metrics: LayoutMetrics
): ItemPlacement {
  if (incomingItem && incomingStyle && incomingItem.id === itemId) {
    return {
      visible: true,
      role: "incoming",
      transform: incomingStyle.transform,
      opacity: incomingStyle.opacity,
      zIndex: incomingStyle.zIndex,
      frameClass: HERO_CAROUSEL_FRAME_CLASS,
      isCenter: false,
    };
  }
  if (displayTriplet.left.id === itemId) {
    const s = slotTransform("left", revolvePhase, metrics);
    return {
      visible: true,
      role: "left",
      transform: s.transform,
      opacity: s.opacity,
      zIndex: s.zIndex,
      frameClass: HERO_CAROUSEL_FRAME_CLASS,
      isCenter: false,
    };
  }
  if (displayTriplet.center.id === itemId) {
    const s = slotTransform("center", revolvePhase, metrics);
    return {
      visible: true,
      role: "center",
      transform: s.transform,
      opacity: s.opacity,
      zIndex: s.zIndex,
      frameClass: HERO_CAROUSEL_FRAME_CLASS,
      isCenter: true,
    };
  }
  if (displayTriplet.right.id === itemId) {
    const s = slotTransform("right", revolvePhase, metrics);
    return {
      visible: true,
      role: "right",
      transform: s.transform,
      opacity: s.opacity,
      zIndex: s.zIndex,
      frameClass: HERO_CAROUSEL_FRAME_CLASS,
      isCenter: false,
    };
  }
  return {
    visible: false,
    transform: "translateX(0) scale(1)",
    opacity: 0,
    zIndex: 0,
    frameClass: HERO_CAROUSEL_FRAME_CLASS,
    isCenter: false,
  };
}

export default function PromoShortTriptychStage({
  items,
  index,
  onIndexChange,
  playerSize = "homeHeroSmall",
  compact = false,
  layout = "stacked",
  viewportClassName,
}: Props) {
  const { t } = useTranslations();
  const count = items.length;
  const current = items[index];

  const prevIndexRef = useRef(index);
  const indexRef = useRef(index);
  const isTransitioningRef = useRef(false);
  const pendingStepRef = useRef(0);
  const pendingFadeTargetRef = useRef<number | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const centerMeasureRef = useRef<HTMLDivElement>(null);

  const [metrics, setMetrics] = useState<LayoutMetrics>(() =>
    layoutMetricsFromCenterWidth(200)
  );
  const [revolvePhase, setRevolvePhase] = useState<RevolvePhase>("idle");
  const [revolveEpoch, setRevolveEpoch] = useState(0);
  const [snapshot, setSnapshot] = useState<Triplet | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [outgoingCenterId, setOutgoingCenterId] = useState<string | null>(null);
  const [viewportOpacity, setViewportOpacity] = useState(1);
  const [transitionMode, setTransitionMode] = useState<"revolve" | "fade">("revolve");
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
          pendingStepRef.current += step;
          pendingFadeTargetRef.current = null;
        } else {
          pendingFadeTargetRef.current = next;
          pendingStepRef.current = 0;
        }
        return;
      }

      onIndexChange(next);
    },
    [count, onIndexChange]
  );

  const go = useCallback(
    (delta: number) => {
      if (count === 0) return;
      if (isTransitioningRef.current) {
        pendingStepRef.current += delta;
        pendingFadeTargetRef.current = null;
        return;
      }
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
      setMetrics(layoutMetricsFromCenterWidth(centerW));
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (centerMeasureRef.current) ro.observe(centerMeasureRef.current);
    const mq = window.matchMedia("(min-width: 640px)");
    const onMq = () => measure();
    mq.addEventListener("change", onMq);
    return () => {
      ro.disconnect();
      mq.removeEventListener("change", onMq);
    };
  }, []);

  useLayoutEffect(() => {
    const prev = prevIndexRef.current;
    if (prev === index) return;

    const mode = getTransitionMode(prev, index, count);
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

    const direction = getRevolveDirection(prev, index, count);
    setAnimPrevIndex(prev);
    setSnapshot(tripletAt(items, prev));
    setIncomingAtEnter(true);
    setRevolvePhase(direction === 1 ? "toNext" : "toPrev");
    setRevolveEpoch((e) => e + 1);
  }, [index, count, items]);

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
      const timer = window.setTimeout(() => endTransition(), REVOLVE_MS + 80);
      return () => window.clearTimeout(timer);
    }
  }, [index, isTransitioning, transitionMode, revolvePhase, endTransition]);

  useEffect(() => {
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
  }, [revolvePhase]);

  const viewportRef = useRef<HTMLDivElement>(null);
  const swipeEnabled = count > 1;

  useHorizontalSwipe(viewportRef, {
    enabled: swipeEnabled,
    onSwipeLeft: () => go(1),
    onSwipeRight: () => go(-1),
  });

  const onViewportKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!swipeEnabled) return;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      go(-1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      go(1);
    }
  };

  if (count === 0) return null;

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
        <div className={`relative mx-auto ${HOME_HERO_TEASER_FRAME_CLASS}`}>
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
            className="mx-auto h-full w-full"
          />
        </div>
      </div>
    );
  }

  const liveTriplet = tripletAt(items, index);
  const displayTriplet = snapshot ?? liveTriplet;
  const animatingRevolve = revolvePhase !== "idle";
  const revolveDurationClass =
    REVOLVE_MS === 500 ? "duration-500" : `duration-[${REVOLVE_MS}ms]`;
  const transitionClass = animatingRevolve
    ? `transition-[transform,opacity] ${revolveDurationClass} ease-in-out motion-reduce:transition-none`
    : "motion-reduce:transition-none";

  const stageOpacityClass =
    transitionMode === "fade"
      ? "transition-opacity duration-300 ease-in-out motion-reduce:transition-none"
      : "";

  const showIncoming = revolvePhase === "toNext" || revolvePhase === "toPrev";
  const wrapCandidate =
    showIncoming && count >= 3 ? incomingItemAt(items, animPrevIndex, revolvePhase) : null;
  const incomingItem =
    wrapCandidate &&
    !(
      (revolvePhase === "toNext" && wrapCandidate.id === displayTriplet.left.id) ||
      (revolvePhase === "toPrev" && wrapCandidate.id === displayTriplet.right.id)
    )
      ? wrapCandidate
      : null;
  const incomingStyle =
    incomingItem && showIncoming
      ? incomingSlotTransform(revolvePhase, incomingAtEnter, metrics)
      : null;

  const liveCenterId = items[index]!.id;
  const stageMinHeight = "min-h-[min(42vh,400px)]";
  const stageMetricsStyle = {
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
      tabIndex={swipeEnabled ? 0 : undefined}
      onKeyDown={onViewportKeyDown}
      className={`${viewportClassName ?? HOME_HERO_PEEK_VIEWPORT_CLASS} touch-pan-y select-none outline-none`}
    >
      {/* layout measure — teaser 프레임 하나만 */}
      <div className="pointer-events-none absolute opacity-0 -z-50" aria-hidden>
        <div ref={centerMeasureRef} className={HERO_CAROUSEL_FRAME_CLASS} />
      </div>

      <div
        className={`relative mx-auto ${stageMinHeight} ${stageOpacityClass}`}
        style={{ opacity: viewportOpacity }}
        aria-live="polite"
      >
        <div
          ref={stageRef}
          className={`relative mx-auto overflow-visible px-2 flex items-center justify-center ${stageMinHeight}`}
          style={stageMetricsStyle}
        >
          {(() => {
            const backSlots: ReactNode[] = [];
            const frontSlots: ReactNode[] = [];

            items.forEach((item, itemIdx) => {
              const placement = placementForItem(
                item.id,
                displayTriplet,
                incomingItem,
                incomingStyle,
                revolvePhase,
                metrics
              );
              const warmCenter =
                !snapshot && circularDistance(itemIdx, index, count) <= 1;
              if (!placement.visible && !warmCenter) return;

              const isTargetCenter = item.id === liveCenterId;
              const isLiveCenter = !snapshot && isTargetCenter;
              const isPromoting =
                animatingRevolve &&
                ((revolvePhase === "toNext" && item.id === displayTriplet.right.id) ||
                  (revolvePhase === "toPrev" && item.id === displayTriplet.left.id));
              const preserveCenterFrame = Boolean(
                snapshot &&
                  (item.id === outgoingCenterId || item.id === liveCenterId || isPromoting)
              );
              const showAsCenter =
                placement.isCenter || isPromoting || (warmCenter && !placement.visible);
              const ariaLiveCenter = isLiveCenter || isPromoting;
              const isWrapArc =
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
              const slotFrameClass = placement.visible
                ? isWrapArc
                  ? HERO_CAROUSEL_WRAP_FRAME_CLASS
                  : placement.frameClass
                : HERO_CAROUSEL_FRAME_CLASS;

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
                  }}
                  aria-hidden={placement.visible ? !ariaLiveCenter : true}
                >
                  {showAsCenter ? (
                    <PromoShortPlayer
                      item={item}
                      isActive={isLiveCenter}
                      playbackEnabled={isLiveCenter && !isTransitioning}
                      preserveFrame={preserveCenterFrame}
                      heroCarouselEmbed
                      videoPreload="auto"
                      variant="teaser"
                      playerSize={playerSize}
                      peekSide={false}
                      layout={layout}
                      compact={compact}
                      scrollExpand={false}
                      loop={false}
                      onPlaybackEnded={
                        isLiveCenter && count > 1 ? handlePlaybackEnded : undefined
                      }
                      className="h-full w-full"
                    />
                  ) : (
                    <PromoShortPeekPreview item={item} compactShell dimOverlay={!isWrapArc} />
                  )}
                  {swipeEnabled && placement.visible && placement.role === "left" && !isWrapArc && (
                    <>
                      <div
                        role="presentation"
                        data-carousel-nav
                        className={PEEK_TAP_LAYER}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => go(-1)}
                      />
                      <div
                        role="presentation"
                        data-carousel-nav
                        className={PEEK_ARROW_ON_LEFT_PEEK}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => go(-1)}
                        aria-hidden
                      >
                        ‹
                      </div>
                    </>
                  )}
                  {swipeEnabled && placement.visible && placement.role === "right" && !isWrapArc && (
                    <>
                      <div
                        role="presentation"
                        data-carousel-nav
                        className={PEEK_TAP_LAYER}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => go(1)}
                      />
                      <div
                        role="presentation"
                        data-carousel-nav
                        className={PEEK_ARROW_ON_RIGHT_PEEK}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => go(1)}
                        aria-hidden
                      >
                        ›
                      </div>
                    </>
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
