"use client";

import PlaybackVideo from "@/components/PlaybackVideo";
import ContentCard from "@/components/ContentCard";
import CreditRolePill from "@/components/profile/CreditRolePill";
import { useTranslations } from "@/context/LocaleContext";
import { gradientForTitle } from "@/lib/works/catalog-ui";
import type { PortfolioWorkItem } from "@/types/portfolio";

type Props = {
  work: PortfolioWorkItem;
};

export default function PortfolioSubmissionWork({ work }: Props) {
  const { t } = useTranslations();

  return (
    <li className="min-w-0 w-full">
      <div className="min-w-0 w-full">
        <ContentCard
          title={work.title}
          thumbnailUrl={work.thumbnailUrl}
          gradient={gradientForTitle(work.title)}
        />
        <div className="mt-2 flex justify-center sm:justify-start">
          <CreditRolePill role={work.role} characterName={work.characterName} />
        </div>
      </div>
      {work.playbackUrl ? (
        <div className="mt-4">
          <PlaybackVideo src={work.playbackUrl} maxHeightClass="max-h-[60vh]" />
        </div>
      ) : (
        <p className="text-sm text-amber-300/90 mt-4">{t("portfolio.public.noPlayback")}</p>
      )}
    </li>
  );
}
