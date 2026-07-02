"use client";

import AppPageShell from "@/components/layout/AppPageShell";
import SubpageHeader from "@/components/layout/SubpageHeader";
import SectionLabel from "@/components/layout/SectionLabel";
import AdminHomeColorPicker from "@/components/home/AdminHomeColorPicker";
import HomeStoryCard from "@/components/home/HomeStoryCard";
import { useTranslations } from "@/context/LocaleContext";
import type { HomeStoryItem } from "@/lib/homeMockData";
import { catalogItemsToHomeStories } from "@/lib/categoryCatalogAdapter";
import { rgba } from "@/lib/campusBrandColors";
import type { SchoolListItem, SchoolStats } from "@/types/school";
import type { CatalogFeedItem } from "@/types/work";

type Props = {
  school: SchoolListItem;
  stats: SchoolStats;
  latest: CatalogFeedItem[];
  mostViewed: CatalogFeedItem[];
  representative: CatalogFeedItem | null;
};

function StoryGrid({ items }: { items: HomeStoryItem[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {items.map((item) => (
        <HomeStoryCard key={item.id} item={item} variant="featured" />
      ))}
    </div>
  );
}

function SchoolHeaderBadge({ school }: { school: SchoolListItem }) {
  const size = 88;
  if (school.logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={school.logoUrl}
        alt={school.name}
        width={size}
        height={size}
        className="rounded-full object-contain bg-white/5 shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="shrink-0 rounded-full flex items-center justify-center font-black text-white"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.32,
        backgroundColor: rgba(school.colorPrimary, 0.25),
        border: `3px solid ${rgba(school.colorPrimary, 0.6)}`,
      }}
    >
      {school.initials}
    </div>
  );
}

export default function SchoolProfilePage({ school, stats, latest, mostViewed, representative }: Props) {
  const { t } = useTranslations();

  const repStory = representative ? catalogItemsToHomeStories([representative])[0] : null;
  const latestStories = catalogItemsToHomeStories(latest);
  const mostViewedStories = catalogItemsToHomeStories(mostViewed);

  return (
    <AppPageShell>
      <SubpageHeader backHref="/schools" backLabel={t("schools.backToSchools")} showHome />

      <div className="flex items-center gap-5 mb-8">
        <SchoolHeaderBadge school={school} />
        <div className="min-w-0">
          <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight truncate">
            {school.name}
          </h1>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-xiio-muted">
            <span>{t("schools.profileMovies")} {stats.movieCount}</span>
            <span>{t("schools.profileSeries")} {stats.seriesCount}</span>
            <span>{t("schools.profileEntertainment")} {stats.entertainmentCount}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-10">
        <section>
          <h2 className="text-lg font-bold text-white mb-3">{t("schools.representative")}</h2>
          {repStory ? (
            <div className="max-w-xs">
              <HomeStoryCard item={repStory} variant="featured" />
            </div>
          ) : (
            <p className="text-sm text-xiio-muted">{t("schools.representativeEmpty")}</p>
          )}
        </section>

        {latestStories.length > 0 && (
          <section>
            <div className="mb-4">
              <SectionLabel>{t("schools.latest")}</SectionLabel>
            </div>
            <StoryGrid items={latestStories} />
          </section>
        )}

        {mostViewedStories.length > 0 && (
          <section>
            <div className="mb-4">
              <SectionLabel>{t("schools.mostViewed")}</SectionLabel>
            </div>
            <StoryGrid items={mostViewedStories} />
          </section>
        )}
      </div>

      <AdminHomeColorPicker />
    </AppPageShell>
  );
}
