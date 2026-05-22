"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from "react";
import { useHorizontalSwipe } from "@/hooks/useHorizontalSwipe";
import PromoShortPeekPool from "@/components/shorts/PromoShortPeekPool";
import {
  centerVideoPreload,
  shouldMountCenterPlayer,
} from "@/components/shorts/promoCarouselUtils";
import PromoShortPlayer, {
  type PromoShortLayout,
  type PromoShortPlayerSize,
  HOME_HERO_PEEK_SIDE_FRAME_CLASS,
  HOME_HERO_PEEK_VIEWPORT_CLASS,
  HOME_HERO_TEASER_FRAME_CLASS,
} from "@/components/shorts/PromoShortPlayer";
import { useTranslations } from "@/context/LocaleContext";
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

type TransitionMode = "slide" | "fade";

function getTransitionMode(prev: number, next: number, count: number): TransitionMode {
  if (count <= 1 || prev === next) return "fade";
  if (prev === count - 1 && next === 0) return "fade";
  if (prev === 0 && next === count - 1) return "fade";
  let step = next - prev;
  if (step < 0) step += count;
  if (step === 1 || step === count - 1) return "slide";
  return "fade";
}

const SLIDE_MS = 500;
const FADE_MS = 300;

/** 홈 피크 — XIIO 로고 II 색, 피크 영상 위 오버레이 */
const PEEK_CAROUSEL_ARROW_BASE =
  "flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center p-0 bg-transparent border-0 shadow-none text-[2.75rem] sm:text-[3.25rem] font-light leading-none text-xiio-accent hover:text-xiio-accent-hover transition pointer-events-auto focus:outline-none focus-visible:ring-2 focus-visible:ring-xiio-accent focus-visible:ring-offset-2 focus-visible:ring-offset-transparent";
const PEEK_ARROW_ON_LEFT_PEEK = `absolute right-2 top-1/2 -translate-y-1/2 z-50 ${PEEK_CAROUSEL_ARROW_BASE}`;
const PEEK_ARROW_ON_RIGHT_PEEK = `absolute left-2 top-1/2 -translate-y-1/2 z-50 ${PEEK_CAROUSEL_ARROW_BASE}`;
const PEEK_TAP_LAYER =
  "absolute inset-0 z-40 cursor-pointer rounded-2xl bg-transparent border-0 p-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-xiio-accent focus-visible:ring-offset-2 focus-visible:ring-offset-transparent";

export default function PromoShortCarousel({
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
  const prevItem = items[(index - 1 + count) % count];
  const nextItem = items[(index + 1) % count];

  const prevIndexRef = useRef(index);
  const trackRef = useRef<HTMLDivElement>(null);
  const [transitionMode, setTransitionMode] = useState<TransitionMode>("slide");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [outgoingIndex, setOutgoingIndex] = useState<number | null>(null);
  const [viewportOpacity, setViewportOpacity] = useState(1);

  const endTransition = useCallback(() => {
    setIsTransitioning(false);
    setOutgoingIndex(null);
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

  useEffect(() => {
    const prev = prevIndexRef.current;
    if (prev === index) return;

    const mode = getTransitionMode(prev, index, count);
    setTransitionMode(mode);
    setIsTransitioning(true);
    setOutgoingIndex(prev);
    prevIndexRef.current = index;

    if (mode === "fade") {
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
  }, [index, count, endTransition]);

  useEffect(() => {
    if (!isTransitioning || transitionMode !== "slide") return;

    const el = trackRef.current;
    if (!el) {
      endTransition();
      return;
    }

    const onEnd = (e: Event) => {
      if (e.target === el && (e as TransitionEvent).propertyName === "transform") {
        endTransition();
      }
    };

    el.addEventListener("transitionend", onEnd);
    const fallback = window.setTimeout(() => endTransition(), SLIDE_MS + 80);

    return () => {
      el.removeEventListener("transitionend", onEnd);
      window.clearTimeout(fallback);
    };
  }, [index, isTransitioning, transitionMode, endTransition]);

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

  const slideCountStyle = { ["--n" as string]: count } as CSSProperties;
  const trackTransitionClass =
    transitionMode === "slide"
      ? "transition-transform duration-500 ease-in-out motion-reduce:transition-none"
      : "motion-reduce:transition-none";

  const centerViewportClass =
    transitionMode === "fade"
      ? "transition-opacity duration-300 ease-in-out motion-reduce:transition-none"
      : "";

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
      <div className={`relative shrink-0 ${HOME_HERO_PEEK_SIDE_FRAME_CLASS}`}>
        {swipeEnabled && (
          <button
            type="button"
            className={PEEK_TAP_LAYER}
            onClick={() => go(-1)}
            aria-label={t("home.promoPrev")}
          />
        )}
        <PromoShortPeekPool items={items} activeIndex={index} visibleId={prevItem.id} />
        {swipeEnabled && (
          <button
            type="button"
            onClick={() => go(-1)}
            className={PEEK_ARROW_ON_LEFT_PEEK}
            aria-hidden
            tabIndex={-1}
          >
            ‹
          </button>
        )}
      </div>

      <div
        className={`relative z-10 shrink-0 overflow-hidden ${HOME_HERO_TEASER_FRAME_CLASS} ${centerViewportClass}`}
        style={{ ...slideCountStyle, opacity: viewportOpacity }}
        aria-live="polite"
      >
        <div
          ref={trackRef}
          className={`flex h-full will-change-transform ${trackTransitionClass}`}
          style={{
            width: "calc(var(--n) * 100%)",
            transform: `translate3d(calc(-100% * ${index} / var(--n)), 0, 0)`,
          }}
        >
          {items.map((item, i) => (
            <div
              key={item.id}
              className="relative h-full shrink-0"
              style={{ width: "calc(100% / var(--n))" }}
              aria-hidden={i !== index}
            >
              {shouldMountCenterPlayer(i, index, count) ? (
                <PromoShortPlayer
                  item={item}
                  isActive={i === index}
                  playbackEnabled={i === index && !isTransitioning}
                  preserveFrame={isTransitioning && outgoingIndex === i}
                  videoPreload={centerVideoPreload(i, index, count)}
                  variant="teaser"
                  playerSize={playerSize}
                  peekSide={false}
                  layout={layout}
                  compact={compact}
                  scrollExpand={false}
                  loop={false}
                  onPlaybackEnded={i === index && count > 1 ? handlePlaybackEnded : undefined}
                  className="mx-auto h-full w-full"
                />
              ) : (
                <div
                  className="mx-auto h-full w-full rounded-2xl bg-gradient-to-br from-gray-900 via-[#1a0533]/80 to-gray-900 border border-white/10"
                  aria-hidden
                />
              )}
            </div>
          ))}
        </div>
        {count > 1 && (
          <div
            className="absolute top-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 pointer-events-auto"
            aria-label={`${current.title} ${index + 1}/${count}`}
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

      <div className={`relative shrink-0 ${HOME_HERO_PEEK_SIDE_FRAME_CLASS}`}>
        {swipeEnabled && (
          <button
            type="button"
            className={PEEK_TAP_LAYER}
            onClick={() => go(1)}
            aria-label={t("home.promoNext")}
          />
        )}
        <PromoShortPeekPool items={items} activeIndex={index} visibleId={nextItem.id} />
        {swipeEnabled && (
          <button
            type="button"
            onClick={() => go(1)}
            className={PEEK_ARROW_ON_RIGHT_PEEK}
            aria-hidden
            tabIndex={-1}
          >
            ›
          </button>
        )}
      </div>
    </div>
  );
}
