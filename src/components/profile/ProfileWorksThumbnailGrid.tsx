"use client";

import ContentCard from "@/components/ContentCard";
import CreditRolePill from "@/components/profile/CreditRolePill";
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

export default function ProfileWorksThumbnailGrid({ items, linkToWatch = true }: Props) {
  if (items.length === 0) return null;

  return (
    <div className="grid gap-x-3 gap-y-5 grid-cols-[repeat(auto-fill,minmax(160px,1fr))]">
      {items.map((w) => {
        const href = linkToWatch ? watchHref(w.ownerUid, w.workId) : undefined;
        return (
          <div key={`${w.ownerUid}_${w.workId}`} className="min-w-0">
            <ContentCard
              href={href}
              title={w.title}
              thumbnailUrl={w.thumbnailUrl ?? undefined}
              gradient={gradientForTitle(w.title)}
            />
            <div className="mt-2 flex justify-center">
              <CreditRolePill role={w.role} characterName={w.characterName} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
