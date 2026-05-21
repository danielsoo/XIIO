"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import PromoShortCarousel from "@/components/shorts/PromoShortCarousel";
import { useTranslations } from "@/context/LocaleContext";
import type { PromoShort } from "@/types/promoShort";

export default function PromoShortSpotlight({ items }: { items: PromoShort[] }) {
  const { t } = useTranslations();
  const [index, setIndex] = useState(0);

  const onIndexChange = useCallback((next: number) => {
    setIndex(next);
  }, []);

  if (items.length === 0) return null;

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

      <PromoShortCarousel
        items={items}
        index={index}
        onIndexChange={onIndexChange}
        compact
        navPosition="home"
      />
    </section>
  );
}
