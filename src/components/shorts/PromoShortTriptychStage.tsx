"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { useHorizontalSwipe } from "@/hooks/useHorizontalSwipe";
import {
  FADE_MS,
  REVOLVE_MS,
  getRevolveDirection,
  getTransitionMode,
} from "@/components/shorts/promoCarouselTransition";
import PromoShortPlayer, {
  type PromoShortLayout,
  type PromoShortPlayerSize,
  HOME_HERO_PEEK_SIDE_FRAME_CLASS,
  HOME_HERO_PEEK_VIEWPORT_CLASS,
  HOME_HERO_TEASER_FRAME_CLASS,
} from "@/components/shorts/PromoShortPlayer";
import { useTranslations } from "@/context/LocaleContext";
import type { PromoShort } from "@/types/promoShort";

type Triplet = { left: PromoShort; center: PromoShort; right: PromoShort };

type RevolvePhase = "idle" | "toNext" | "toPrev";

type SlotRole = "left" | "center" | "right" | "incoming";

const ENTER_GAP_PX = 100;

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

const PEEK_ARROW_BASE =
  "flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center p-0 bg-transparent border-0 shadow-none text-[2.75rem] sm:text-[3.25rem] font-light leading-none text-xiio-accent hover:text-xiio-accent-hover transition pointer-events-auto focus:outline-none focus-visible:ring-2 focus-visible:ring-xiio-accent focus-visible:ring-offset-2 focus-visible:ring-offset-transparent";

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
  const exitX = offsetX + 80;

  if (phase === "idle") {
    if (role === "left") {
      return {
        transform: `translateX(${-offsetX}px) scale(${peekScale})`,
        opacity: 1,
        zIndex: 5,
      };
    }
    if (role === "right") {
      return {
        transform: `translateX(${offsetX}px) scale(${peekScale})`,
        opacity: 1,
        zIndex: 5,
      };
    }
    return { transform: "translateX(0) scale(1)", opacity: 1, zIndex: 10 };
  }

  if (phase === "toNext") {
    if (role === "left") {
      return {
        transform: `translateX(${-exitX}px) scale(${peekScale})`,
        opacity: 0,
        zIndex: 1,
      };
    }
    if (role === "center") {
      return {
        transform: `translateX(${-offsetX}px) scale(${peekScale})`,
        opacity: 1,
        zIndex: 5,
      };
    }
    return { transform: "translateX(0) scale(1)", opacity: 1, zIndex: 10 };
  }

  if (role === "right") {
    return {
      transform: `translateX(${exitX}px) scale(${peekScale})`,
      opacity: 0,
      zIndex: 1,
    };
  }
  if (role === "center") {
    return {
      transform: `translateX(${offsetX}px) scale(${peekScale})`,
      opacity: 1,
      zIndex: 5,
    };
  }
  return { transform: "translateX(0) scale(1)", opacity: 1, zIndex: 10 };
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
      zIndex: 5,
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
    zIndex: 5,
  };
}

function incomingItemAt(items: PromoShort[], centerIndex: number, phase: "toNext" | "toPrev"): PromoShort {
  const n = items.length;
  if (phase === "toNext") return items[(centerIndex + 2) % n]!;
  return items[(centerIndex - 2 + n) % n]!;
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
  const stageRef = useRef<HTMLDivElement>(null);
  const centerMeasureRef = useRef<HTMLDivElement>(null);
  const peekMeasureRef = useRef<HTMLDivElement>(null);

  const [metrics, setMetrics] = useState<LayoutMetrics>({ offsetX: 200, peekScale: 0.76 });
  const [revolvePhase, setRevolvePhase] = useState<RevolvePhase>("idle");
  const [snapshot, setSnapshot] = useState<Triplet | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [outgoingCenterId, setOutgoingCenterId] = useState<string | null>(null);
  const [viewportOpacity, setViewportOpacity] = useState(1);
  const [transitionMode, setTransitionMode] = useState<"revolve" | "fade">("revolve");
  const [animPrevIndex, setAnimPrevIndex] = useState(0);
  const [incomingAtEnter, setIncomingAtEnter] = useState(true);

  const endTransition = useCallback(() => {
    setIsTransitioning(false);
    setOutgoingCenterId(null);
    setSnapshot(null);
    setRevolvePhase("idle");
  }, []);

  const go = useCallback(
    (delta: number) => {
      if (count === 0) return;
      onIndexChange((index + delta + count) % count);
    },
    [count, index, onIndexChange]
  );

  const handlePlaybackEnded = useCallback(() => {
    if (count > 1) go(1);
  }, [count, go]);

  useLayoutEffect(() => {
    const measure = () => {
      const centerEl = centerMeasureRef.current;
      const peekEl = peekMeasureRef.current;
      if (!centerEl || !peekEl) return;
      const centerW = centerEl.offsetWidth;
      const peekW = peekEl.offsetWidth;
      if (centerW <= 0 || peekW <= 0) return;
      const gap = 4;
      setMetrics({
        offsetX: centerW / 2 + gap + peekW / 2,
        peekScale: peekW / centerW,
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (centerMeasureRef.current) ro.observe(centerMeasureRef.current);
    if (peekMeasureRef.current) ro.observe(peekMeasureRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const prev = prevIndexRef.current;
    if (prev === index) return;

    const mode = getTransitionMode(prev, index, count);
    setTransitionMode(mode);
    setIsTransitioning(true);
    setOutgoingCenterId(items[prev]?.id ?? null);
    prevIndexRef.current = index;

    if (mode === "fade") {
      setSnapshot(null);
      setRevolvePhase("idle");
      setViewportOpacity(0);
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => setViewportOpacity(1));
      });
      const timer = window.setTimeout(() => endTransition(), FADE_MS);
      return () => {
        cancelAnimationFrame(raf);
        window.clearTimeout(timer);
      };
    }

    const direction = getRevolveDirection(prev, index, count);
    setAnimPrevIndex(prev);
    setSnapshot(tripletAt(items, prev));
    setIncomingAtEnter(true);
    setRevolvePhase("idle");
    const targetPhase = direction === 1 ? "toNext" : "toPrev";
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => setRevolvePhase(targetPhase));
    });
    return () => cancelAnimationFrame(raf);
  }, [index, count, items, endTransition]);

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

  useEffect(() => {
    if (!isTransitioning || transitionMode !== "revolve" || revolvePhase === "idle") return;

    const timer = window.setTimeout(() => endTransition(), REVOLVE_MS + 80);
    return () => window.clearTimeout(timer);
  }, [index, isTransitioning, transitionMode, revolvePhase, endTransition]);

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
  const transitionClass = animatingRevolve
    ? "transition-[transform,opacity] duration-500 ease-in-out motion-reduce:transition-none"
    : "motion-reduce:transition-none";

  const stageOpacityClass =
    transitionMode === "fade"
      ? "transition-opacity duration-300 ease-in-out motion-reduce:transition-none"
      : "";

  const slots: { role: SlotRole; item: PromoShort }[] = [
    { role: "left", item: displayTriplet.left },
    { role: "center", item: displayTriplet.center },
    { role: "right", item: displayTriplet.right },
  ];

  const showIncoming = revolvePhase === "toNext" || revolvePhase === "toPrev";
  const incomingItem =
    showIncoming && count >= 3 ? incomingItemAt(items, animPrevIndex, revolvePhase) : null;
  const incomingStyle =
    incomingItem && showIncoming
      ? incomingSlotTransform(revolvePhase, incomingAtEnter, metrics)
      : null;

  const stageMinHeight = "min-h-[min(42vh,400px)]";

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
      {/* layout measure */}
      <div className="pointer-events-none absolute opacity-0 -z-50 flex gap-1" aria-hidden>
        <div ref={peekMeasureRef} className={HOME_HERO_PEEK_SIDE_FRAME_CLASS} />
        <div ref={centerMeasureRef} className={HOME_HERO_TEASER_FRAME_CLASS} />
      </div>

      <div
        className={`relative mx-auto ${stageMinHeight} ${stageOpacityClass}`}
        style={{ opacity: viewportOpacity }}
        aria-live="polite"
      >
        <div
          ref={stageRef}
          className={`relative mx-auto overflow-hidden flex items-center justify-center ${stageMinHeight}`}
          style={{ minWidth: `${Math.round(metrics.offsetX * 2 + ENTER_GAP_PX + 48)}px` }}
        >
          {slots.map(({ role, item }) => {
            const { transform, opacity, zIndex } = slotTransform(role, revolvePhase, metrics);
            const isCenter = role === "center";
            const isLiveCenter = !snapshot && isCenter;
            const wasOutgoingCenter = snapshot && isCenter && item.id === outgoingCenterId;

            return (
              <div
                key={`${role}-${item.id}`}
                className={`absolute top-1/2 left-1/2 -translate-y-1/2 will-change-transform ${transitionClass} ${
                  isCenter ? HOME_HERO_TEASER_FRAME_CLASS : HOME_HERO_PEEK_SIDE_FRAME_CLASS
                }`}
                style={{
                  transform: `translate(-50%, -50%) ${transform}`,
                  opacity,
                  zIndex,
                }}
                aria-hidden={!isCenter}
              >
                {swipeEnabled && isCenter && (
                  <>
                    <button
                      type="button"
                      onClick={() => go(-1)}
                      className={`absolute right-2 top-1/2 -translate-y-1/2 z-50 ${PEEK_ARROW_BASE}`}
                      aria-label={t("home.promoPrev")}
                    />
                    <button
                      type="button"
                      onClick={() => go(1)}
                      className={`absolute left-2 top-1/2 -translate-y-1/2 z-50 ${PEEK_ARROW_BASE}`}
                      aria-label={t("home.promoNext")}
                    />
                  </>
                )}
                <PromoShortPlayer
                  item={item}
                  isActive={isLiveCenter}
                  playbackEnabled={isLiveCenter && !isTransitioning}
                  preserveFrame={Boolean(snapshot && wasOutgoingCenter)}
                  videoPreload={isCenter ? "auto" : "metadata"}
                  variant="teaser"
                  playerSize={playerSize}
                  peekSide={!isCenter}
                  layout={layout}
                  compact={compact}
                  scrollExpand={false}
                  loop={false}
                  onPlaybackEnded={isLiveCenter && count > 1 ? handlePlaybackEnded : undefined}
                  className="h-full w-full"
                />
                {swipeEnabled && !isCenter && (
                  <button
                    type="button"
                    className="absolute inset-0 z-40 cursor-pointer rounded-2xl bg-transparent border-0 p-0"
                    onClick={() => (role === "left" ? go(-1) : go(1))}
                    aria-label={role === "left" ? t("home.promoPrev") : t("home.promoNext")}
                  />
                )}
              </div>
            );
          })}
          {incomingItem && incomingStyle && (
            <div
              key={`incoming-${incomingItem.id}`}
              className={`absolute top-1/2 left-1/2 -translate-y-1/2 will-change-transform ${transitionClass} ${HOME_HERO_PEEK_SIDE_FRAME_CLASS}`}
              style={{
                transform: `translate(-50%, -50%) ${incomingStyle.transform}`,
                opacity: incomingStyle.opacity,
                zIndex: incomingStyle.zIndex,
              }}
              aria-hidden
            >
              <PromoShortPlayer
                item={incomingItem}
                isActive={false}
                playbackEnabled={false}
                videoPreload="metadata"
                variant="teaser"
                playerSize={playerSize}
                peekSide
                layout={layout}
                compact={compact}
                scrollExpand={false}
                loop={false}
                className="h-full w-full"
              />
            </div>
          )}
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
                onClick={() => onIndexChange(i)}
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
