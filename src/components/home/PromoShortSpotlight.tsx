"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import PromoShortPlayer from "@/components/shorts/PromoShortPlayer";
import { useTranslations } from "@/context/LocaleContext";
import type { PromoShort } from "@/types/promoShort";

export default function PromoShortSpotlight({ items }: { items: PromoShort[] }) {
  const { t } = useTranslations();
  const [index, setIndex] = useState(0);
  const count = items.length;

  const go = useCallback(
    (delta: number) => {
      setIndex((i) => (i + delta + count) % count);
    },
    [count]
  );

  if (count === 0) return null;

  const current = items[index];

  return (
    <section className="w-full max-w-5xl mx-auto" aria-label={t("home.promoSectionTitle")}>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-5 px-1">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-xiio-accent mb-1">
            {t("home.promoBadge")}
          </p>
          <h2 className="text-2xl md:text-3xl font-black text-white">{t("home.promoSectionTitle")}</h2>
        </div>
        <Link
          href="/shorts"
          className="text-sm text-xiio-muted hover:text-xiio-accent transition shrink-0"
        >
          {t("common.viewAll")}
        </Link>
      </div>

      <div className="relative min-h-[min(520px,68vh)] flex justify-center">
        {items.map((item, i) => (
          <div
            key={item.id}
            className={`w-full max-w-lg transition-opacity duration-500 ${
              i === index ? "opacity-100 relative z-10" : "opacity-0 absolute inset-0 pointer-events-none z-0"
            }`}
            aria-hidden={i !== index}
          >
            <PromoShortPlayer
              item={item}
              isActive={i === index}
              layout="stacked"
              compact
              className="w-full"
            />
          </div>
        ))}

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              className="absolute left-0 md:left-2 top-[38%] -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-black/50 border border-white/20 text-white hover:bg-black/70 transition backdrop-blur-sm"
              aria-label={t("home.promoPrev")}
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              className="absolute right-0 md:right-2 top-[38%] -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-black/50 border border-white/20 text-white hover:bg-black/70 transition backdrop-blur-sm"
              aria-label={t("home.promoNext")}
            >
              ›
            </button>
            <div className="flex justify-center gap-2 mt-4">
              {items.map((item, i) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setIndex(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === index ? "w-8 bg-xiio-accent" : "w-1.5 bg-white/25 hover:bg-white/40"
                  }`}
                  aria-label={`${current.title} ${i + 1}/${count}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
