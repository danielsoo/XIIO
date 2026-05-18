"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import PromoShortPlayer from "@/components/shorts/PromoShortPlayer";
import { PROMO_SHORTS } from "@/data/promoShorts";
import { useTranslations } from "@/context/LocaleContext";

export default function ShortsPageContent() {
  const { t } = useTranslations();
  const searchParams = useSearchParams();
  const promoId = searchParams.get("promo");

  const initialIndex = Math.max(
    0,
    PROMO_SHORTS.findIndex((s) => s.id === promoId)
  );
  const [index, setIndex] = useState(initialIndex >= 0 ? initialIndex : 0);
  const count = PROMO_SHORTS.length;

  useEffect(() => {
    if (!promoId) return;
    const i = PROMO_SHORTS.findIndex((s) => s.id === promoId);
    if (i >= 0) setIndex(i);
  }, [promoId]);

  const go = useCallback(
    (delta: number) => {
      setIndex((i) => (i + delta + count) % count);
    },
    [count]
  );

  return (
    <main className="min-h-screen bg-xiio-bg pt-24 px-4 md:px-8 pb-16">
      <header className="max-w-5xl mx-auto mb-6">
        <h1 className="text-3xl font-black text-white mb-1">{t("category.shortsTitle")}</h1>
        <p className="text-xiio-muted text-sm">{t("category.shortsSubtitle")}</p>
      </header>

      <div className="max-w-5xl mx-auto relative min-h-[240px]">
        {PROMO_SHORTS.map((item, i) => (
          <div
            key={item.id}
            className={`w-full transition-opacity duration-500 ${
              i === index ? "opacity-100 relative" : "opacity-0 absolute inset-0 pointer-events-none"
            }`}
            aria-hidden={i !== index}
          >
            <PromoShortPlayer item={item} isActive={i === index} embedded={false} className="w-full" />
          </div>
        ))}

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-black/50 border border-white/20 text-white hover:bg-black/70 transition backdrop-blur-sm"
              aria-label={t("home.promoPrev")}
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-black/50 border border-white/20 text-white hover:bg-black/70 transition backdrop-blur-sm"
              aria-label={t("home.promoNext")}
            >
              ›
            </button>
          </>
        )}
      </div>

      {count > 1 && (
        <div className="max-w-5xl mx-auto mt-6 flex flex-wrap gap-2 justify-center">
          {PROMO_SHORTS.map((item, i) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setIndex(i)}
              className={`px-3 py-1.5 rounded-full text-sm transition border ${
                i === index
                  ? "bg-xiio-accent/20 border-xiio-accent/50 text-white"
                  : "border-white/15 text-xiio-muted hover:text-white hover:border-white/30"
              }`}
            >
              {item.title}
            </button>
          ))}
        </div>
      )}

      <p className="max-w-5xl mx-auto mt-4 text-center text-xs text-xiio-muted">
        {t("shorts.fullscreenHint")}
      </p>
    </main>
  );
}
