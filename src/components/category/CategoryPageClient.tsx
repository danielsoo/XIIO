"use client";

import ContentCard from "@/components/ContentCard";
import { useCatalogFeed } from "@/hooks/useCatalogFeed";
import { useTranslations } from "@/context/LocaleContext";
import { gradientForTitle } from "@/lib/works/catalog-ui";
import type { WorkSection } from "@/types/work";

export default function CategoryPageClient({
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
  const { items, loading } = useCatalogFeed(section, 12);

  return (
    <main className="min-h-screen bg-xiio-bg pt-24 px-6 md:px-12 pb-16">
      {badgeKey ? (
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-xiio-accent/20 border border-xiio-accent/40 text-xiio-accent text-xs font-semibold mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-xiio-accent animate-pulse" />
            {t(badgeKey)}
          </div>
          <h1 className="text-3xl font-black text-white mb-2">{t(titleKey)}</h1>
          <p className="text-xiio-muted text-sm">{t(subtitleKey)}</p>
        </div>
      ) : (
        <header className="mb-8">
          <h1 className="text-3xl font-black text-white mb-2">{t(titleKey)}</h1>
          <p className="text-xiio-muted text-sm">{t(subtitleKey)}</p>
        </header>
      )}

      {loading ? (
        <p className="text-xiio-muted">{t("common.loading")}</p>
      ) : items.length === 0 ? (
        <p className="text-xiio-muted">{t("catalog.empty")}</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {items.map((item) => (
            <ContentCard
              key={item.id}
              title={item.title}
              contentCategory={item.approvedCategory}
              tags={item.approvedTags}
              thumbnailUrl={item.thumbnailUrl}
              gradient={gradientForTitle(item.title)}
            />
          ))}
        </div>
      )}
    </main>
  );
}
