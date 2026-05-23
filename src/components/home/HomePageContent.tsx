"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import HomeHeroActions from "@/components/HomeHeroActions";
import HomeCatalogSection from "@/components/home/HomeCatalogSection";
import PromoShortCarousel from "@/components/shorts/PromoShortCarousel";
import { HOME_HERO_PEEK_VIEWPORT_CLASS } from "@/components/shorts/PromoShortPlayer";
import { useTranslations } from "@/context/LocaleContext";
import { usePromoFeed } from "@/hooks/usePromoFeed";
import type { WorkSection } from "@/types/work";

const HOME_SECTIONS: { href: string; section: WorkSection; titleKey: string }[] = [
  { href: "/movies", section: "movies", titleKey: "nav.movies" },
  { href: "/entertainment", section: "entertainment", titleKey: "nav.entertainment" },
  { href: "/series", section: "series", titleKey: "nav.series" },
  { href: "/school-battle", section: "school-battle", titleKey: "nav.schoolBattle" },
];

export default function HomePageContent() {
  const { t } = useTranslations();
  const { items: promoItems } = usePromoFeed(true);
  const searchParams = useSearchParams();
  const promoId = searchParams.get("promo");
  const [promoIndex, setPromoIndex] = useState(0);
  const hasPromo = promoItems.length > 0;
  const count = promoItems.length;

  useEffect(() => {
    if (!promoId || count === 0) return;
    const i = promoItems.findIndex((s) => s.id === promoId);
    if (i >= 0) setPromoIndex(i);
  }, [promoId, promoItems, count]);

  const onPromoIndexChange = useCallback((next: number) => {
    setPromoIndex(next);
  }, []);

  return (
    <main className="min-h-screen bg-xiio-bg">
      <section className="relative min-h-[max(42vh,380px)] overflow-visible">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0533] via-[#0a0a20] to-[#0a0a0a]" />
        <div className="absolute inset-0 bg-gradient-to-r from-xiio-accent/20 to-transparent" />
        <div className="relative z-10 w-full px-4 sm:px-6 md:px-8 lg:px-10 pt-24 pb-12 md:pt-28 md:pb-16">
          <div
            className={`mx-auto w-full max-w-7xl grid gap-10 items-center ${
              hasPromo ? "md:grid-cols-[minmax(0,1fr)_auto] md:gap-8 lg:gap-12" : ""
            }`}
          >
            <div className={hasPromo ? "min-w-0 max-w-xl" : "max-w-2xl"}>
              <div className="inline-block px-3 py-1 rounded-full bg-xiio-accent/20 border border-xiio-accent/40 text-xiio-accent text-xs font-semibold mb-4">
                {t("home.heroBadge")}
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4 leading-tight">
                {t("home.heroTitleLine1")}
                <br />
                {t("home.heroTitleLine2")}
              </h1>
              <p className="text-xiio-muted text-base md:text-lg mb-6 max-w-lg">{t("home.heroSubtitle")}</p>
              <HomeHeroActions />
            </div>

            {hasPromo && (
              <div className="w-full min-w-0" aria-label={t("home.promoSectionTitle")}>
                <PromoShortCarousel
                  items={promoItems}
                  index={promoIndex}
                  onIndexChange={onPromoIndexChange}
                  playerSize="homeHeroSmall"
                  compact
                  viewportClassName={HOME_HERO_PEEK_VIEWPORT_CLASS}
                />
              </div>
            )}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-xiio-bg to-transparent" />
      </section>

      <div className="px-6 md:px-12 pb-16 space-y-12">
        {HOME_SECTIONS.map(({ href, section, titleKey }) => (
          <HomeCatalogSection key={href} section={section} href={href} titleKey={titleKey} />
        ))}
      </div>
    </main>
  );
}
