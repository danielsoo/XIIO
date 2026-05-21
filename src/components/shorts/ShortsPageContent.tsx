"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import PromoShortCarousel from "@/components/shorts/PromoShortCarousel";
import { useTranslations } from "@/context/LocaleContext";
import { usePromoFeed } from "@/hooks/usePromoFeed";

export default function ShortsPageContent() {
  const { t } = useTranslations();
  const { items, loading } = usePromoFeed(true);
  const searchParams = useSearchParams();
  const promoId = searchParams.get("promo");

  const initialIndex = Math.max(0, items.findIndex((s) => s.id === promoId));
  const [index, setIndex] = useState(initialIndex >= 0 ? initialIndex : 0);
  const count = items.length;

  useEffect(() => {
    if (!promoId || count === 0) return;
    const i = items.findIndex((s) => s.id === promoId);
    if (i >= 0) setIndex(i);
  }, [promoId, items, count]);

  const onIndexChange = useCallback((next: number) => {
    setIndex(next);
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-xiio-bg pt-24 flex items-center justify-center">
        <p className="text-xiio-muted">{t("common.loading")}</p>
      </main>
    );
  }

  if (count === 0) {
    return (
      <main className="min-h-screen bg-xiio-bg pt-24 px-4 text-center">
        <p className="text-xiio-muted mt-20">{t("home.promoEmpty")}</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-xiio-bg pt-24 px-4 md:px-8 pb-16">
      <header className="max-w-5xl mx-auto mb-6">
        <h1 className="text-3xl font-black text-white mb-1">{t("category.shortsTitle")}</h1>
        <p className="text-xiio-muted text-sm">{t("category.shortsSubtitle")}</p>
      </header>

      <PromoShortCarousel
        items={items}
        index={index}
        onIndexChange={onIndexChange}
        variant="default"
        playerSize="shortsPage"
        layout="stacked"
        navPosition="shorts"
        viewportClassName="relative mx-auto w-full"
      />

      <p className="max-w-5xl mx-auto mt-4 text-center text-xs text-xiio-muted">
        {t("shorts.fullscreenHint")}
      </p>
    </main>
  );
}
