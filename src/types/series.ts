export type SeriesEpisode = {
  id: string;
  seasonNumber: number;
  episodeNumber: number;
  title: string;
  synopsis: string;
  durationSec: number;
  releaseDate: string;
  thumbnailUrl: string;
  ownerUid: string;
  workId: string;
};

export type SeriesSeason = {
  seasonNumber: number;
  title: string;
  episodes: SeriesEpisode[];
};

export type SeriesDetail = {
  id: string;
  title: string;
  synopsis: string;
  genre: string;
  seasons: SeriesSeason[];
};
