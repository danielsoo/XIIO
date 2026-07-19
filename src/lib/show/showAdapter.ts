import { SERIES_MOCK_VIDEO_URLS } from "@/data/seriesMockMedia";
import type { SeriesDetail, SeriesEpisode, SeriesSeason } from "@/types/series";

type ShowFixture = {
  id: string;
  title: string;
  synopsis: string;
  format: string;
  seasonCount: number;
  episodeTitles: string[];
  artwork: string[];
};

const SHOW_ARTWORK = {
  hero: "/images/hero/show-catalog-v1.png",
  talk: "/images/show/show-talk-v1.jpg",
  cooking: "/images/show/show-cooking-v1.jpg",
  game: "/images/show/show-game-v1.jpg",
  music: "/images/show/show-music-v1.jpg",
  outdoor: "/images/show/show-outdoor-v1.jpg",
  house: "/images/show/show-house-v1.jpg",
} as const;

const SHOW_FIXTURES: ShowFixture[] = [
  {
    id: "off-script",
    title: "Off Script",
    synopsis:
      "Five creators face one unpredictable challenge with no rehearsals and no second takes — only the moment as it happens.",
    format: "Studio Challenge",
    seasonCount: 2,
    episodeTitles: [
      "First Bell",
      "Blind Build",
      "Switch Sides",
      "One Take Only",
      "The Silent Round",
      "Team Challenge",
      "Double or Nothing",
      "Final Buzzer",
    ],
    artwork: [SHOW_ARTWORK.hero, SHOW_ARTWORK.game, SHOW_ARTWORK.talk],
  },
  {
    id: "campus-kitchen",
    title: "Campus Kitchen",
    synopsis:
      "Student teams turn tiny budgets and mystery ingredients into dishes worthy of the final tasting table.",
    format: "Cooking Competition",
    seasonCount: 2,
    episodeTitles: [
      "Pantry Raid",
      "Three Ingredients",
      "Midnight Menu",
      "Roommate Recipe",
      "Street Food Sprint",
      "No-Oven Challenge",
      "Chef Swap",
      "Final Plate",
    ],
    artwork: [SHOW_ARTWORK.cooking],
  },
  {
    id: "guess-the-scene",
    title: "Guess the Scene",
    synopsis:
      "Creators race to identify iconic storytelling moments using only clues, impressions, and one very unreliable host.",
    format: "Studio Quiz",
    seasonCount: 1,
    episodeTitles: [
      "One Line Only",
      "Sound Effects",
      "Freeze Frame",
      "Wrong Answers",
      "Director's Cut",
      "The Prop Round",
      "Final Guess",
      "Audience Choice",
    ],
    artwork: [SHOW_ARTWORK.talk, SHOW_ARTWORK.game, SHOW_ARTWORK.hero],
  },
  {
    id: "night-mission",
    title: "Campus Mission",
    synopsis:
      "Teams cross campus solving clues, completing surprise missions, and trying to reach the finish before time runs out.",
    format: "Outdoor Mission",
    seasonCount: 1,
    episodeTitles: [
      "The First Clue",
      "Library Dash",
      "Secret Landmark",
      "Outdoor Team Race",
      "Trade a Hint",
      "No Maps Allowed",
      "The Long Route",
      "Finish Line",
    ],
    artwork: [SHOW_ARTWORK.outdoor],
  },
  {
    id: "roommates",
    title: "Roommate Rules",
    synopsis:
      "Five roommates share one house, a growing rulebook, and a weekly mission that turns ordinary routines into a competition.",
    format: "Observational Reality",
    seasonCount: 3,
    episodeTitles: [
      "Move-In Day",
      "Kitchen Duty",
      "House Mission",
      "Secret Roommate",
      "Quiet Hours",
      "Budget Week",
      "Rule Breakers",
      "House Meeting",
    ],
    artwork: [SHOW_ARTWORK.house],
  },
  {
    id: "sound-check",
    title: "Sound Check Live",
    synopsis:
      "Campus musicians perform, collaborate, and take on live challenges before a small audience with nowhere to hide.",
    format: "Live Music Show",
    seasonCount: 1,
    episodeTitles: [
      "Opening Note",
      "Song Swap",
      "Live in Ten",
      "Acoustic Round",
      "Audience Request",
      "Harmony Test",
      "One More Song",
      "Encore",
    ],
    artwork: [SHOW_ARTWORK.music],
  },
  {
    id: "one-take",
    title: "Quick Fire",
    synopsis:
      "Fast questions, louder buzzers, and a new team game every round decide who can think under pressure.",
    format: "Studio Game",
    seasonCount: 2,
    episodeTitles: [
      "Ready, Set, Buzz",
      "Ten-Second Rule",
      "Block Party",
      "Quick Draw",
      "Studio Game",
      "Wildcard Round",
      "Sudden Death",
      "Champions Table",
    ],
    artwork: [SHOW_ARTWORK.game],
  },
  {
    id: "weekend-club",
    title: "Weekend Club",
    synopsis:
      "A rotating group of creators spends one weekend exploring a new activity, neighborhood, or campus tradition.",
    format: "Youth Travel Show",
    seasonCount: 1,
    episodeTitles: [
      "Saturday Morning",
      "Campus Scavenger Hunt",
      "Neighborhood Guide",
      "One-Day Club",
      "Photo Mission",
      "Local Favorites",
      "Last Bus Home",
      "Weekend Finale",
    ],
    artwork: [SHOW_ARTWORK.outdoor],
  },
  {
    id: "the-green-room",
    title: "Backstage Bingo",
    synopsis:
      "Performers trade stories, play backstage games, and build a surprise stage together before the doors open.",
    format: "Music & Talk",
    seasonCount: 1,
    episodeTitles: [
      "Before the Doors",
      "Music & Talk",
      "Backstage Bingo",
      "Mic Check Stories",
      "Setlist Shuffle",
      "Green Room Games",
      "Opening Act",
      "After the Encore",
    ],
    artwork: [SHOW_ARTWORK.music, SHOW_ARTWORK.talk, SHOW_ARTWORK.game],
  },
  {
    id: "no-rehearsal",
    title: "No Rehearsal",
    synopsis:
      "Creators arrive without a script and discover the rules only when the cameras start rolling.",
    format: "Creator Games",
    seasonCount: 1,
    episodeTitles: [
      "Cameras On",
      "Mystery Guest",
      "Hidden Rule",
      "Team Switch",
      "No Retakes",
      "Open Challenge",
      "Last Surprise",
      "Wrap Party",
    ],
    artwork: [SHOW_ARTWORK.hero, SHOW_ARTWORK.game, SHOW_ARTWORK.talk],
  },
];

function releaseDateFor(showIndex: number, seasonNumber: number, episodeNumber: number): string {
  const base = Date.UTC(2025, 7, 1);
  const offsetDays = showIndex * 3 + (seasonNumber - 1) * 120 + (episodeNumber - 1) * 7;
  return new Date(base + offsetDays * 86_400_000).toISOString();
}

function buildSeason(fixture: ShowFixture, showIndex: number, seasonNumber: number): SeriesSeason {
  const episodes: SeriesEpisode[] = fixture.episodeTitles.map((title, index) => ({
    id: `${fixture.id}-s${seasonNumber}e${index + 1}`,
    seasonNumber,
    episodeNumber: index + 1,
    title: seasonNumber === 1 ? title : `${title}: Remix`,
    synopsis: `${fixture.title} brings the cast together for ${title.toLowerCase()}, with a new mission and an outcome nobody can rehearse.`,
    durationSec: (28 + ((showIndex + seasonNumber + index) % 5) * 3) * 60,
    releaseDate: releaseDateFor(showIndex, seasonNumber, index + 1),
    thumbnailUrl: fixture.artwork[(index + seasonNumber - 1) % fixture.artwork.length],
    videoUrl: SERIES_MOCK_VIDEO_URLS[(showIndex + seasonNumber + index) % SERIES_MOCK_VIDEO_URLS.length],
    ownerUid: "",
    workId: "",
  }));

  return { seasonNumber, title: `Season ${seasonNumber}`, episodes };
}

export function buildShowCatalog(): SeriesDetail[] {
  return SHOW_FIXTURES.map((fixture, showIndex) => ({
    id: fixture.id,
    title: fixture.title,
    synopsis: fixture.synopsis,
    genre: fixture.format,
    seasons: Array.from({ length: fixture.seasonCount }, (_, index) =>
      buildSeason(fixture, showIndex, index + 1)
    ),
  }));
}
