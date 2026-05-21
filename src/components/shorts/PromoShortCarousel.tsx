"use client";

import { useCallback, useRef } from "react";
import PromoShortPeekPreview from "@/components/shorts/PromoShortPeekPreview";
import PromoShortPlayer, {
  type PromoShortLayout,
  type PromoShortPlayerSize,
  type PromoShortVariant,
  HOME_HERO_PEEK_SIDE_FRAME_CLASS,
  HOME_HERO_PEEK_VIEWPORT_CLASS,
  HOME_HERO_TEASER_FRAME_CLASS,
} from "@/components/shorts/PromoShortPlayer";
import { useTranslations } from "@/context/LocaleContext";
import type { PromoShort } from "@/types/promoShort";

type NavPosition = "home" | "homeHero" | "shorts";

type Props = {
  items: PromoShort[];
  index: number;
  onIndexChange: (index: number) => void;
  /** 홈 미리보기: 메타 없음, 탭 시 숏츠로 이동 */
  variant?: PromoShortVariant;
  playerSize?: PromoShortPlayerSize;
  compact?: boolean;
  layout?: PromoShortLayout;
  viewportClassName?: string;
  navPosition?: NavPosition;
};

/** 홈 피크 — XIIO 로고 II 색, 피크 영상 위 오버레이 */
const PEEK_CAROUSEL_ARROW_BASE =
  "flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center p-0 bg-transparent border-0 shadow-none text-[2.75rem] sm:text-[3.25rem] font-light leading-none text-xiio-accent hover:text-xiio-accent-hover transition pointer-events-auto focus:outline-none focus-visible:ring-2 focus-visible:ring-xiio-accent focus-visible:ring-offset-2 focus-visible:ring-offset-transparent";
const PEEK_ARROW_ON_LEFT_PEEK = `absolute right-2 top-1/2 -translate-y-1/2 z-50 ${PEEK_CAROUSEL_ARROW_BASE}`;
const PEEK_ARROW_ON_RIGHT_PEEK = `absolute left-2 top-1/2 -translate-y-1/2 z-50 ${PEEK_CAROUSEL_ARROW_BASE}`;

const NAV_CLASSES: Record<NavPosition, { prev: string; next: string }> = {
  home: {
    prev: "absolute left-0 md:left-2 top-1/2 -translate-y-1/2 z-20",
    next: "absolute right-0 md:right-2 top-1/2 -translate-y-1/2 z-20",
  },
  homeHero: {
    prev: "absolute left-0 top-1/2 -translate-y-1/2 z-30",
    next: "absolute right-0 top-1/2 -translate-y-1/2 z-30",
  },
  shorts: {
    prev: "absolute -left-2 md:left-0 top-1/2 -translate-y-1/2 z-20",
    next: "absolute -right-2 md:right-0 top-1/2 -translate-y-1/2 z-20",
  },
};

function HomeHeroPeekCarousel({
  items,
  index,
  onIndexChange,
  playerSize,
  compact,
  layout,
  viewportClassName,
}: {
  items: PromoShort[];
  index: number;
  onIndexChange: (n: number) => void;
  playerSize: PromoShortPlayerSize;
  compact: boolean;
  layout: PromoShortLayout;
  viewportClassName?: string;
}) {
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

  return (
    <div className={viewportClassName ?? HOME_HERO_PEEK_VIEWPORT_CLASS}>
      <div className={`relative shrink-0 ${HOME_HERO_PEEK_SIDE_FRAME_CLASS}`}>
        <PromoShortPeekPreview item={prevItem} />
        {count > 1 && (
          <button
            type="button"
            onClick={() => go(-1)}
            className={PEEK_ARROW_ON_LEFT_PEEK}
            aria-label={t("home.promoPrev")}
          >
            ‹
          </button>
        )}
      </div>

      <div className={`relative z-10 shrink-0 ${HOME_HERO_TEASER_FRAME_CLASS}`}>
        {items.map((item, i) => (
          <div
            key={item.id}
            className={`transition-opacity duration-300 ${
              i === index
                ? "relative z-10 opacity-100"
                : "absolute inset-0 opacity-0 pointer-events-none z-0"
            }`}
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
              className="mx-auto"
            />
          </div>
        ))}
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
        <PromoShortPeekPreview item={nextItem} />
        {count > 1 && (
          <button
            type="button"
            onClick={() => go(1)}
            className={PEEK_ARROW_ON_RIGHT_PEEK}
            aria-label={t("home.promoNext")}
          >
            ›
          </button>
        )}
      </div>
    </div>
  );
}

export default function PromoShortCarousel({
  items,
  index,
  onIndexChange,
  variant = "default",
  playerSize = "default",
  compact = false,
  layout = "stacked",
  viewportClassName = "relative min-h-[min(520px,68vh)] flex justify-center w-full max-w-lg mx-auto",
  navPosition = "home",
}: Props) {
  const scrollExpand = variant !== "teaser";
  const { t } = useTranslations();
  const viewportRef = useRef<HTMLDivElement>(null);
  const count = items.length;
  const current = items[index];
  const nav = NAV_CLASSES[navPosition];

  const go = useCallback(
    (delta: number) => {
      if (count === 0) return;
      onIndexChange((index + delta + count) % count);
    },
    [count, index, onIndexChange]
  );

  if (count === 0) return null;

  if (variant === "teaser" && navPosition === "homeHero") {
    return (
      <HomeHeroPeekCarousel
        items={items}
        index={index}
        onIndexChange={onIndexChange}
        playerSize={playerSize}
        compact={compact}
        layout={layout}
        viewportClassName={viewportClassName}
      />
    );
  }

  return (
    <div ref={viewportRef} className={viewportClassName}>
      {items.map((item, i) => (
        <div
          key={item.id}
          className={`w-full transition-opacity duration-500 ${
            i === index ? "opacity-100 relative z-10" : "opacity-0 absolute inset-0 pointer-events-none z-0"
          }`}
          aria-hidden={i !== index}
        >
          <PromoShortPlayer
            item={item}
            isActive={i === index}
            variant={variant}
            playerSize={playerSize}
            layout={layout}
            compact={compact}
            scrollExpand={scrollExpand}
            scrollRootRef={scrollExpand ? viewportRef : undefined}
            className={
              playerSize === "homeHeroSmall" || playerSize === "shortsPage" ? "mx-auto" : "w-full"
            }
          />
        </div>
      ))}

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            className={`${nav.prev} h-10 w-10 rounded-full bg-black/50 border border-white/20 text-white hover:bg-black/70 transition backdrop-blur-sm`}
            aria-label={t("home.promoPrev")}
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            className={`${nav.next} h-10 w-10 rounded-full bg-black/50 border border-white/20 text-white hover:bg-black/70 transition backdrop-blur-sm`}
            aria-label={t("home.promoNext")}
          >
            ›
          </button>
          <div
            className="absolute top-3 right-14 z-30 flex items-center gap-1.5 pointer-events-auto"
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
        </>
      )}
    </div>
  );
}
