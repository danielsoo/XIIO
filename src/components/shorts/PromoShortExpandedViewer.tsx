"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import PromoShortPlayer from "@/components/shorts/PromoShortPlayer";
import { useHorizontalSwipe } from "@/hooks/useHorizontalSwipe";
import { useTranslations } from "@/context/LocaleContext";
import type { PromoShort } from "@/types/promoShort";

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-7 h-7 text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)]"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 3v3a2 2 0 01-2 2H3m18 0h-3a2 2 0 01-2-2V3m0 18v-3a2 2 0 012-2h3M3 16h3a2 2 0 012 2v3"
      />
    </svg>
  );
}

type Props = {
  items: PromoShort[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
};

export default function PromoShortExpandedViewer({
  items,
  index,
  onIndexChange,
  onClose,
}: Props) {
  const { t } = useTranslations();
  const viewportRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const count = items.length;
  const current = items[index];

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (count > 1 && e.key === "ArrowLeft") {
        e.preventDefault();
        onIndexChange((index - 1 + count) % count);
      }
      if (count > 1 && e.key === "ArrowRight") {
        e.preventDefault();
        onIndexChange((index + 1) % count);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [count, index, onClose, onIndexChange]);

  const go = useCallback(
    (delta: number) => {
      if (count === 0) return;
      onIndexChange((index + delta + count) % count);
    },
    [count, index, onIndexChange]
  );

  useHorizontalSwipe(viewportRef, {
    enabled: count > 1,
    onSwipeLeft: () => go(1),
    onSwipeRight: () => go(-1),
  });

  const handlePlaybackEnded = useCallback(() => {
    if (count > 1) go(1);
  }, [count, go]);

  if (!mounted || !current) return null;

  return createPortal(
    <div
      ref={viewportRef}
      className="fixed inset-0 z-[200] flex flex-col bg-black touch-pan-y select-none outline-none"
      role="dialog"
      aria-modal="true"
      aria-label={t("home.promoSectionTitle")}
      tabIndex={-1}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 z-[210] p-1 hover:opacity-80 transition-opacity"
        aria-label={t("shorts.exitFullscreen")}
      >
        <CloseIcon />
      </button>

      {count > 1 ? (
        <div
          className="absolute top-4 left-1/2 z-[210] flex -translate-x-1/2 items-center gap-1.5 pointer-events-auto"
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
      ) : null}

      <div className="flex min-h-0 flex-1 w-full items-center justify-center px-4 pb-6 pt-14">
        <PromoShortPlayer
          key={current.id}
          item={current}
          isActive
          expandedChrome
          layout="stacked"
          scrollExpand
          scrollRootRef={viewportRef}
          loop={false}
          onPlaybackEnded={count > 1 ? handlePlaybackEnded : undefined}
          className="flex h-full w-full max-h-[min(88vh,900px)] max-w-lg items-center justify-center"
        />
      </div>
    </div>,
    document.body
  );
}
