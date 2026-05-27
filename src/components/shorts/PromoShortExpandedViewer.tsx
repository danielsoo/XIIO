"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import PromoShortCarouselStage from "@/components/shorts/PromoShortCarouselStage";
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4 sm:p-6 touch-pan-y select-none outline-none"
      role="dialog"
      aria-modal="true"
      aria-label={t("home.promoSectionTitle")}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full max-w-[min(100%,72rem)] max-h-[min(92vh,960px)] min-h-0 flex flex-col overflow-visible"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-2 right-2 z-[210] p-1 hover:opacity-80 transition-opacity"
          aria-label={t("shorts.exitFullscreen")}
        >
          <CloseIcon />
        </button>

        <PromoShortCarouselStage
          items={items}
          index={index}
          onIndexChange={onIndexChange}
          centerMode="expanded"
          layout="stacked"
          viewportClassName="relative w-full min-h-0 flex items-center justify-center outline-none touch-pan-y select-none"
        />
      </div>
    </div>,
    document.body
  );
}
