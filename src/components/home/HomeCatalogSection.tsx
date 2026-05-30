"use client";

import Link from "next/link";
import ContentCard from "@/components/ContentCard";
import { useCatalogFeed } from "@/hooks/useCatalogFeed";
import { useTranslations } from "@/context/LocaleContext";
import { gradientForTitle, VIDEO_THUMB_ROUNDED_CLASS, watchHref } from "@/lib/works/catalog-ui";
import { promoCropToVideoStyle } from "@/lib/works/promo-crop-interaction";
import type { WorkSection } from "@/types/work";

type Props = {
  section: WorkSection;
  href: string;
  titleKey: string;
};

export default function HomeCatalogSection({ section, href, titleKey }: Props) {
  const { t } = useTranslations();
  const { items, loading } = useCatalogFeed(section, 4);

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">{t(titleKey)}</h2>
        <Link href={href} className="text-sm text-xiio-muted hover:text-xiio-accent transition">
          {t("common.viewAll")}
        </Link>
      </div>
      {loading ? (
        <p className="text-xiio-muted text-sm">{t("common.loading")}</p>
      ) : items.length === 0 ? (
        <p className="text-xiio-muted text-sm">{t("catalog.empty")}</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {items.map((item) => (
            <ContentCard
              key={item.id}
              href={watchHref(item.ownerUid, item.workId)}
              title={item.title}
              contentCategory={item.approvedCategory}
              tags={item.approvedTags}
              thumbnailUrl={item.thumbnailUrl}
              imageStyle={item.thumbnailCrop ? promoCropToVideoStyle(item.thumbnailCrop) : undefined}
              gradient={gradientForTitle(item.title)}
              roundedClassName={VIDEO_THUMB_ROUNDED_CLASS}
            />
          ))}
        </div>
      )}
    </section>
  );
}
