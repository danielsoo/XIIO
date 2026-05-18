"use client";

import ContentCard from "@/components/ContentCard";
import { useTranslations } from "@/context/LocaleContext";

type Item = { title: string; category: string; gradient: string };

export default function CategoryPageShell({
  titleKey,
  subtitleKey,
  badgeKey,
  items,
}: {
  titleKey: string;
  subtitleKey: string;
  badgeKey?: string;
  items: Item[];
}) {
  const { t } = useTranslations();

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
        <>
          <h1 className="text-3xl font-black text-white mb-2">{t(titleKey)}</h1>
          <p className="text-xiio-muted text-sm mb-8">{t(subtitleKey)}</p>
        </>
      )}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {items.map((m) => (
          <ContentCard key={m.title} {...m} />
        ))}
      </div>
    </main>
  );
}
