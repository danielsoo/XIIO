"use client";

import ContentCard from "@/components/ContentCard";
import HeroLandscapeBackdrop from "@/components/hero/HeroLandscapeBackdrop";
import { useCatalogFeed } from "@/hooks/useCatalogFeed";
import { useHomeHeroTheme } from "@/context/HomeHeroThemeContext";
import { useTranslations } from "@/context/LocaleContext";
import { gradientForTitle, watchHref } from "@/lib/works/catalog-ui";
import type { WorkSection } from "@/types/work";

export default function CategoryPageWithHero({
  section,
  titleKey,
  subtitleKey,
  badgeKey,
}: {
  section: WorkSection;
  titleKey: string;
  subtitleKey: string;
  badgeKey?: string;
}) {
  const { t } = useTranslations();
  const { rgbTuple, overlayEnabled, heroStyle } = useHomeHeroTheme();
  const { items, loading } = useCatalogFeed(section, 12);

  return (
    <main className="min-h-screen pb-16" style={heroStyle}>
      <section className="relative min-h-[200px] px-4 sm:px-6 lg:px-10 pb-8 pt-4">
        <HeroLandscapeBackdrop
          rgbTuple={rgbTuple}
          overlayEnabled={overlayEnabled}
          backgroundScope="home"
          variant="compact"
        />
        <header className="relative z-10 pt-4">
          {badgeKey ? (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-400 text-xs font-semibold mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
              {t(badgeKey)}
            </div>
          ) : null}
          <h1 className="text-3xl font-black text-white mb-2">{t(titleKey)}</h1>
          <p className="text-white/50 text-sm max-w-xl">{t(subtitleKey)}</p>
        </header>
      </section>

      <div className="px-4 sm:px-6 lg:px-10">
        {loading ? (
          <p className="text-white/45">{t("common.loading")}</p>
        ) : items.length === 0 ? (
          <p className="text-white/45">{t("catalog.empty")}</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {items.map((item) => (
              <ContentCard
                key={item.id}
                href={watchHref(item.ownerUid, item.workId)}
                title={item.title}
                contentCategory={item.approvedCategory}
                tags={item.approvedTags}
                thumbnailUrl={item.thumbnailUrl}
                gradient={gradientForTitle(item.title)}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
