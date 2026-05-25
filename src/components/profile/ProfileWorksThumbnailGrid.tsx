"use client";

import ContentCard from "@/components/ContentCard";
import { useTranslations } from "@/context/LocaleContext";
import { gradientForTitle, watchHref } from "@/lib/works/catalog-ui";

export type ProfileWorkGridItem = {
  workId: string;
  ownerUid: string;
  title: string;
  role: string;
  characterName?: string;
  thumbnailUrl?: string | null;
};

type Props = {
  items: ProfileWorkGridItem[];
  /** false면 썸네일만 표시 (제출 링크 등) */
  linkToWatch?: boolean;
};

function roleLabel(
  t: (key: string) => string,
  role: string,
  characterName?: string
): string {
  const base = t(`network.credits.role.${role}`);
  return characterName ? `${base} · ${characterName}` : base;
}

export default function ProfileWorksThumbnailGrid({ items, linkToWatch = true }: Props) {
  const { t } = useTranslations();

  if (items.length === 0) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-3 gap-y-5">
      {items.map((w) => {
        const href = linkToWatch ? watchHref(w.ownerUid, w.workId) : undefined;
        const caption = roleLabel(t, w.role, w.characterName);
        return (
          <div key={`${w.ownerUid}_${w.workId}`} className="min-w-0">
            <ContentCard
              href={href}
              title={w.title}
              thumbnailUrl={w.thumbnailUrl ?? undefined}
              gradient={gradientForTitle(w.title)}
            />
            <p className="mt-1.5 text-xs text-xiio-muted text-center truncate" title={caption}>
              {caption}
            </p>
          </div>
        );
      })}
    </div>
  );
}
