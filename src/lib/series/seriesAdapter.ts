import { SERIES_FIXTURES, type SeriesFixture } from "@/data/seriesFixtures";
import { SERIES_MOCK_THUMBNAILS, SERIES_MOCK_VIDEO_URLS } from "@/data/seriesMockMedia";
import type { CatalogFeedItem } from "@/types/work";
import type { SeriesDetail, SeriesEpisode, SeriesSeason } from "@/types/series";

function hashStringToInt(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i++) {
    h = (h * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function releaseDateFor(seasonNumber: number, episodeNumber: number): string {
  const base = Date.UTC(2024, 0, 1);
  const offsetDays = (seasonNumber - 1) * 90 + (episodeNumber - 1) * 7;
  return new Date(base + offsetDays * 86_400_000).toISOString();
}

function publishedAtIso(value: unknown): string | null {
  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }

  if (!value || typeof value !== "object") return null;
  const candidate = value as {
    toDate?: () => Date;
    toMillis?: () => number;
    seconds?: number;
    _seconds?: number;
  };

  if (typeof candidate.toDate === "function") return candidate.toDate().toISOString();
  if (typeof candidate.toMillis === "function") {
    return new Date(candidate.toMillis()).toISOString();
  }

  const seconds = candidate.seconds ?? candidate._seconds;
  return typeof seconds === "number" ? new Date(seconds * 1_000).toISOString() : null;
}

function pickRealItem(pool: CatalogFeedItem[], index: number): CatalogFeedItem | undefined {
  if (pool.length === 0) return undefined;
  return pool[index % pool.length];
}

function fixtureToSeriesDetail(
  fixture: SeriesFixture,
  pool: CatalogFeedItem[],
  poolOffset = 0
): SeriesDetail {
  let globalIndex = 0;
  const seasons: SeriesSeason[] = fixture.seasons.map((season) => ({
    seasonNumber: season.seasonNumber,
    title: season.title,
    episodes: season.episodes.map((ep) => {
      const real = pickRealItem(pool, poolOffset + globalIndex++);
      const episode: SeriesEpisode = {
        id: `${fixture.id}-s${season.seasonNumber}e${ep.episodeNumber}`,
        seasonNumber: season.seasonNumber,
        episodeNumber: ep.episodeNumber,
        title: ep.title,
        synopsis: ep.synopsis,
        durationSec: ep.durationMinutes * 60,
        releaseDate:
          publishedAtIso(real?.publishedAt) ??
          releaseDateFor(season.seasonNumber, ep.episodeNumber),
        thumbnailUrl:
          real?.thumbnailUrl ??
          SERIES_MOCK_THUMBNAILS[(poolOffset + globalIndex - 1) % SERIES_MOCK_THUMBNAILS.length],
        videoUrl:
          SERIES_MOCK_VIDEO_URLS[(poolOffset + globalIndex - 1) % SERIES_MOCK_VIDEO_URLS.length],
        ownerUid: real?.ownerUid ?? "",
        workId: real?.workId ?? "",
      };
      return episode;
    }),
  }));

  return {
    id: fixture.id,
    title: fixture.title,
    synopsis: fixture.synopsis,
    genre: fixture.genre,
    seasons,
  };
}

/** Flat (non-episodic) real catalog item, wrapped as a single-season/single-episode series. */
function flatFallback(item: CatalogFeedItem): SeriesDetail {
  const episode: SeriesEpisode = {
    id: item.id,
    seasonNumber: 1,
    episodeNumber: 1,
    title: item.title,
    synopsis: item.approvedTags.join(" · "),
    durationSec: 0,
    releaseDate: releaseDateFor(1, 1),
    thumbnailUrl: item.thumbnailUrl ?? "",
    videoUrl: SERIES_MOCK_VIDEO_URLS[0],
    ownerUid: item.ownerUid,
    workId: item.workId,
  };
  return {
    id: item.id,
    title: item.title,
    synopsis: item.approvedTags.join(" · "),
    genre: item.approvedCategory ?? item.section,
    seasons: [{ seasonNumber: 1, title: "Season 1", episodes: [episode] }],
  };
}

/** Series catalog rows (New Episodes This Week, Binge-Worthy Collections, …). */
export function buildSeriesCatalog(realItems: CatalogFeedItem[]): SeriesDetail[] {
  return SERIES_FIXTURES.map((fixture, index) =>
    fixtureToSeriesDetail(fixture, realItems, index * 2)
  );
}

/** All episodes across the mock catalog, newest release first — for a "New Episodes This Week" row. */
export function newestEpisodesAcrossCatalog(
  realItems: CatalogFeedItem[],
  limit = 8
): SeriesEpisode[] {
  const all = buildSeriesCatalog(realItems).flatMap((series) =>
    series.seasons.flatMap((season) => season.episodes)
  );
  return all
    .filter((ep) => ep.workId)
    .sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime())
    .slice(0, limit);
}

/**
 * Series-detail (Watch page) for one specific work: finds the mock series/episode
 * this work plays as, or falls back to a flat single-episode series if no fixture
 * data is available.
 */
export function buildSeriesForWork(
  focusItem: CatalogFeedItem,
  realItems: CatalogFeedItem[]
): { series: SeriesDetail; seasonIndex: number; episodeIndex: number } {
  if (SERIES_FIXTURES.length === 0 || realItems.length === 0) {
    return { series: flatFallback(focusItem), seasonIndex: 0, episodeIndex: 0 };
  }

  const alreadyInPool = realItems.some(
    (i) => i.workId === focusItem.workId && i.ownerUid === focusItem.ownerUid
  );
  const pool = alreadyInPool ? realItems : [focusItem, ...realItems];

  const fixture = SERIES_FIXTURES[hashStringToInt(focusItem.id) % SERIES_FIXTURES.length];
  const series = fixtureToSeriesDetail(fixture, pool);

  for (let s = 0; s < series.seasons.length; s++) {
    const e = series.seasons[s].episodes.findIndex(
      (ep) => ep.workId === focusItem.workId && ep.ownerUid === focusItem.ownerUid
    );
    if (e >= 0) return { series, seasonIndex: s, episodeIndex: e };
  }

  return { series, seasonIndex: 0, episodeIndex: 0 };
}
