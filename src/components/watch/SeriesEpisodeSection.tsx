"use client";

import { useMemo } from "react";
import SeriesEpisodePanel from "@/components/watch/SeriesEpisodePanel";
import { useCatalogFeed } from "@/hooks/useCatalogFeed";
import { buildSeriesForWork } from "@/lib/series/seriesAdapter";
import type { PublicWorkCredit } from "@/types/watch";
import type { CatalogFeedItem, VideoAspectRatio } from "@/types/work";

type Props = {
  focusItem: CatalogFeedItem;
  approvedAspectRatio?: VideoAspectRatio;
  approvedSchoolId?: string;
  approvedSchoolName?: string;
  credits: PublicWorkCredit[];
};

export default function SeriesEpisodeSection({
  focusItem,
  approvedAspectRatio,
  approvedSchoolId,
  approvedSchoolName,
  credits,
}: Props) {
  const { items, loading } = useCatalogFeed("series", 24);

  const built = useMemo(() => buildSeriesForWork(focusItem, items), [focusItem, items]);

  if (loading) return null;

  return (
    <SeriesEpisodePanel
      series={built.series}
      initialSeasonIndex={built.seasonIndex}
      initialEpisodeIndex={built.episodeIndex}
      currentOwnerUid={focusItem.ownerUid}
      currentWorkId={focusItem.workId}
      approvedAspectRatio={approvedAspectRatio}
      approvedSchoolId={approvedSchoolId}
      approvedSchoolName={approvedSchoolName}
      credits={credits}
    />
  );
}
