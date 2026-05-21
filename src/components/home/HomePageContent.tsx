"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
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
  { href: "/shorts", section: "shorts", titleKey: "nav.shorts" },
  { href: "/school-battle", section: "school-battle", titleKey: "nav.schoolBattle" },
];

export default function HomePageContent() {
  const { t } = useTranslations();
  const { items: promoItems } = usePromoFeed(true);
  const [promoIndex, setPromoIndex] = useState(0);
  const hasPromo = promoItems.length > 0;

  const onPromoIndexChange = useCallback((next: number) => {
    setPromoIndex(next);
  }, []);

  return (
    <main className="min-h-screen bg-xiio-bg">
      <section className="relative min-h-[max(42vh,380px)] overflow-visible">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0533] via-[#0a0a20] to-[#0a0a0a]" />
        <div className="absolute inset-0 bg-gradient-to-r from-xiio-accent/20 to-transparent" />
        <div className="relative z-10 w-full max-w-7xl mx-auto pl-4 pr-6 pt-24 pb-12 sm:pl-5 md:pl-6 md:pr-10 md:pt-28 md:pb-16 lg:pl-8 lg:pr-14">
          <div
            className={`grid gap-10 lg:gap-10 items-center ${
              hasPromo ? "md:grid-cols-[minmax(0,1fr)_auto] md:gap-8 lg:gap-10" : ""
            }`}
          >
            <div className={hasPromo ? "min-w-0 max-w-xl justify-self-start" : "max-w-2xl"}>
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
                  variant="teaser"
                  playerSize="homeHeroSmall"
                  compact
                  navPosition="homeHero"
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
