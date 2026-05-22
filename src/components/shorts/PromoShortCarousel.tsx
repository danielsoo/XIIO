"use client";

import { useCallback, useRef, type KeyboardEvent } from "react";
import { useHorizontalSwipe } from "@/hooks/useHorizontalSwipe";
import PromoShortPeekPreview from "@/components/shorts/PromoShortPeekPreview";
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

/** 홈 피크 — XIIO 로고 II 색, 피크 영상 위 오버레이 */
const PEEK_CAROUSEL_ARROW_BASE =
  "flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center p-0 bg-transparent border-0 shadow-none text-[2.75rem] sm:text-[3.25rem] font-light leading-none text-xiio-accent hover:text-xiio-accent-hover transition pointer-events-auto focus:outline-none focus-visible:ring-2 focus-visible:ring-xiio-accent focus-visible:ring-offset-2 focus-visible:ring-offset-transparent";
const PEEK_ARROW_ON_LEFT_PEEK = `absolute right-2 top-1/2 -translate-y-1/2 z-50 ${PEEK_CAROUSEL_ARROW_BASE}`;
const PEEK_ARROW_ON_RIGHT_PEEK = `absolute left-2 top-1/2 -translate-y-1/2 z-50 ${PEEK_CAROUSEL_ARROW_BASE}`;
const PEEK_TAP_LAYER =
  "absolute inset-0 z-40 cursor-pointer rounded-2xl bg-transparent border-0 p-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-xiio-accent focus-visible:ring-offset-2 focus-visible:ring-offset-transparent";

const SLIDE_TRACK_CLASS =
  "flex h-full transition-transform duration-500 ease-in-out motion-reduce:transition-none";

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
        <PromoShortPeekPreview item={prevItem} />
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
        className={`relative z-10 shrink-0 overflow-hidden ${HOME_HERO_TEASER_FRAME_CLASS}`}
        aria-live="polite"
      >
        <div
          className={SLIDE_TRACK_CLASS}
          style={{
            transform: count > 0 ? `translateX(calc(-100% * ${index} / ${count}))` : undefined,
          }}
        >
          {items.map((item, i) => (
            <div
              key={item.id}
              className={`relative shrink-0 ${HOME_HERO_TEASER_FRAME_CLASS}`}
              aria-hidden={i !== index}
            >
              <PromoShortPlayer
                item={item}
                isActive={i === index}
                variant="teaser"
                playerSize={playerSize}
                peekSide={false}
                layout={layout}
                compact={compact}
                scrollExpand={false}
                loop={false}
                onPlaybackEnded={i === index && count > 1 ? handlePlaybackEnded : undefined}
                className="mx-auto"
              />
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
        <PromoShortPeekPreview item={nextItem} />
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
