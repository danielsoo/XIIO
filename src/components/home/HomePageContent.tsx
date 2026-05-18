"use client";

import HomeHeroActions from "@/components/HomeHeroActions";
import HomeCatalogSection from "@/components/home/HomeCatalogSection";
import PromoShortSpotlight from "@/components/home/PromoShortSpotlight";
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

  return (
    <main className="min-h-screen bg-xiio-bg">
      <section className="relative h-[42vh] min-h-[280px] flex items-end overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0533] via-[#0a0a20] to-[#0a0a0a]" />
        <div className="absolute inset-0 bg-gradient-to-r from-xiio-accent/20 to-transparent" />
        <div className="relative z-10 px-8 pb-12 md:px-16">
          <div className="inline-block px-3 py-1 rounded-full bg-xiio-accent/20 border border-xiio-accent/40 text-xiio-accent text-xs font-semibold mb-4">
            {t("home.heroBadge")}
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white mb-4 leading-tight">
            {t("home.heroTitleLine1")}
            <br />
            {t("home.heroTitleLine2")}
          </h1>
          <p className="text-xiio-muted text-base md:text-lg mb-6 max-w-lg">{t("home.heroSubtitle")}</p>
          <HomeHeroActions />
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-xiio-bg to-transparent" />
      </section>

      <section className="px-4 md:px-8 -mt-2 pb-10 md:pb-14">
        <PromoShortSpotlight items={promoItems} />
      </section>

      <div className="px-6 md:px-12 pb-16 space-y-12">
        {HOME_SECTIONS.map(({ href, section, titleKey }) => (
          <HomeCatalogSection key={href} section={section} href={href} titleKey={titleKey} />
        ))}
      </div>
    </main>
  );
}
