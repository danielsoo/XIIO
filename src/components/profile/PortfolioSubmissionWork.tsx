"use client";

import PlaybackVideo from "@/components/PlaybackVideo";
import ContentCard from "@/components/ContentCard";
import { useTranslations } from "@/context/LocaleContext";
import { gradientForTitle } from "@/lib/works/catalog-ui";
import type { PortfolioWorkItem } from "@/types/portfolio";

type Props = {
  work: PortfolioWorkItem;
};

export default function PortfolioSubmissionWork({ work }: Props) {
  const { t } = useTranslations();
  const roleKey = `network.credits.role.${work.role}`;
  const caption = work.characterName
    ? `${t(roleKey)} · ${work.characterName}`
    : t(roleKey);

  return (
    <li className="max-w-3xl">
      <div className="max-w-md mx-auto sm:mx-0">
        <ContentCard
          title={work.title}
          thumbnailUrl={work.thumbnailUrl}
          gradient={gradientForTitle(work.title)}
        />
        <p className="mt-1.5 text-xs text-xiio-muted text-center sm:text-left truncate">{caption}</p>
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
