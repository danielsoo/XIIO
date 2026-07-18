/**
 * Series/season/episode seed content — isolated fixture for the episodic browsing UI.
 * No Firestore schema exists for episodic series yet; `src/lib/series/seriesAdapter.ts`
 * layers this structure over real published catalog works (for playback/thumbnails) so
 * the UI is fully functional today and can be pointed at real episodic data later by
 * swapping this file out, without touching the components.
 */

export type SeriesFixtureEpisode = {
  episodeNumber: number;
  title: string;
  synopsis: string;
  durationMinutes: number;
};

export type SeriesFixtureSeason = {
  seasonNumber: number;
  title: string;
  episodes: SeriesFixtureEpisode[];
};

export type SeriesFixture = {
  id: string;
  title: string;
  synopsis: string;
  genre: string;
  seasons: SeriesFixtureSeason[];
};

export const SERIES_FIXTURES: SeriesFixture[] = [
  {
    id: "campus-after-dark",
    title: "Campus After Dark",
    synopsis:
      "When the libraries close and the quad empties out, a handful of night-shift students keep the campus running — and stumble into everything it's hiding.",
    genre: "Mystery / Drama",
    seasons: [
      {
        seasonNumber: 1,
        title: "Season 1",
        episodes: [
          {
            episodeNumber: 1,
            title: "Lights Out at Hartwell",
            synopsis:
              "A power outage strands the overnight security crew in the humanities building, where a first-year finds a door that shouldn't be unlocked.",
            durationMinutes: 24,
          },
          {
            episodeNumber: 2,
            title: "The Custodian's Key",
            synopsis:
              "A veteran custodian's master key opens more than supply closets, and the night crew starts asking what else it opens.",
            durationMinutes: 21,
          },
          {
            episodeNumber: 3,
            title: "Radio Silence",
            synopsis:
              "The campus radio station's overnight DJ starts taking calls from a number that traces back to a dorm room demolished a decade ago.",
            durationMinutes: 27,
          },
          {
            episodeNumber: 4,
            title: "Second Shift",
            synopsis:
              "Two rival RAs are forced to cover the same shift and compare notes on the things they've each been pretending not to see.",
            durationMinutes: 23,
          },
          {
            episodeNumber: 5,
            title: "What the Quad Remembers",
            synopsis:
              "The season's threads knot together on the one night a year the quad's oldest tradition refuses to stay a rumor.",
            durationMinutes: 29,
          },
        ],
      },
      {
        seasonNumber: 2,
        title: "Season 2",
        episodes: [
          {
            episodeNumber: 1,
            title: "New Locks",
            synopsis:
              "Campus security overhauls every lock on the east side after last spring — but the night crew finds the new keys open the old doors too.",
            durationMinutes: 25,
          },
          {
            episodeNumber: 2,
            title: "The Transfer",
            synopsis:
              "A transfer student who clearly knows more than she's letting on requests the same overnight shift, on purpose.",
            durationMinutes: 22,
          },
          {
            episodeNumber: 3,
            title: "Sub-Basement",
            synopsis:
              "Facilities sends the crew to inventory a sub-basement that isn't on any campus map they can find.",
            durationMinutes: 26,
          },
          {
            episodeNumber: 4,
            title: "Homecoming Weekend",
            synopsis:
              "Alumni flood back for homecoming, and one of them keeps asking questions about a night shift from twenty years ago.",
            durationMinutes: 28,
          },
          {
            episodeNumber: 5,
            title: "The Long Walk Back",
            synopsis:
              "The season closes with the whole crew walking the length of campus at 4 a.m., finally following the story to where it started.",
            durationMinutes: 31,
          },
        ],
      },
    ],
  },
  {
    id: "the-green-room",
    title: "The Green Room",
    synopsis:
      "A mockumentary crew embeds with a chronically underfunded student theater troupe as they attempt one impossible production per semester.",
    genre: "Comedy / Mockumentary",
    seasons: [
      {
        seasonNumber: 1,
        title: "Season 1",
        episodes: [
          {
            episodeNumber: 1,
            title: "Casting Chaos",
            synopsis:
              "Auditions for the fall production go sideways when the only student who can play the lead also directs, stage-manages, and built the set.",
            durationMinutes: 19,
          },
          {
            episodeNumber: 2,
            title: "The Budget Meeting",
            synopsis:
              "The troupe's entire semester budget is revealed to be $340 and a box of expired stage blood.",
            durationMinutes: 18,
          },
          {
            episodeNumber: 3,
            title: "Understudy Uprising",
            synopsis:
              "The understudies stage a very theatrical protest after being cut from the program for the third show in a row.",
            durationMinutes: 22,
          },
          {
            episodeNumber: 4,
            title: "Tech Week",
            synopsis:
              "Everything that can go wrong during tech week does, including a fog machine incident the fire marshal will remember.",
            durationMinutes: 24,
          },
          {
            episodeNumber: 5,
            title: "Opening Night",
            synopsis:
              "The show somehow goes on, and somehow, most of it works — which the troupe finds almost as alarming as when it doesn't.",
            durationMinutes: 26,
          },
        ],
      },
      {
        seasonNumber: 2,
        title: "Season 2",
        episodes: [
          {
            episodeNumber: 1,
            title: "The Sequel Nobody Asked For",
            synopsis:
              "Riding a wave of modest goodwill, the troupe attempts an original musical with a cast of two and a script of unclear length.",
            durationMinutes: 20,
          },
          {
            episodeNumber: 2,
            title: "Guest Director",
            synopsis:
              "A visiting alum offers to direct for free, which turns out to have several very expensive creative conditions attached.",
            durationMinutes: 23,
          },
          {
            episodeNumber: 3,
            title: "The Rival Troupe",
            synopsis:
              "A rival theater club poaches half the cast three weeks before opening, forcing some very creative doubling of roles.",
            durationMinutes: 21,
          },
          {
            episodeNumber: 4,
            title: "Load-In",
            synopsis:
              "Moving the set into the venue reveals the set was built two inches too wide for every door in the building.",
            durationMinutes: 19,
          },
          {
            episodeNumber: 5,
            title: "Strike",
            synopsis:
              "Closing night ends the only way it can: the whole troupe, at 1 a.m., taking the set apart and already pitching next semester.",
            durationMinutes: 25,
          },
        ],
      },
    ],
  },
  {
    id: "signal-lost",
    title: "Signal Lost",
    synopsis:
      "The campus engineering club's weather-balloon project picks up a transmission that shouldn't exist, and can't stop chasing it.",
    genre: "Sci-Fi / Thriller",
    seasons: [
      {
        seasonNumber: 1,
        title: "Season 1",
        episodes: [
          {
            episodeNumber: 1,
            title: "Payload",
            synopsis:
              "A student-built weather balloon returns from the stratosphere carrying a recording that predates the balloon's own launch.",
            durationMinutes: 22,
          },
          {
            episodeNumber: 2,
            title: "Triangulation",
            synopsis:
              "The club rigs three rooftops with makeshift antennae to pin down where — and when — the signal is actually coming from.",
            durationMinutes: 24,
          },
          {
            episodeNumber: 3,
            title: "The Faculty Advisor",
            synopsis:
              "The club's faculty advisor recognizes the signal's pattern immediately, and refuses to say from where.",
            durationMinutes: 23,
          },
          {
            episodeNumber: 4,
            title: "Dead Air",
            synopsis:
              "The signal stops for six days, and the club has to decide whether to go public with what they've already recorded.",
            durationMinutes: 20,
          },
          {
            episodeNumber: 5,
            title: "Uplink",
            synopsis:
              "A second, stronger signal answers the first — and it's coming from somewhere on campus.",
            durationMinutes: 27,
          },
        ],
      },
      {
        seasonNumber: 2,
        title: "Season 2",
        episodes: [
          {
            episodeNumber: 1,
            title: "Quiet Season",
            synopsis:
              "Months of silence lead the club to mothball the project, until a new first-year finds their old logs and starts asking questions.",
            durationMinutes: 21,
          },
          {
            episodeNumber: 2,
            title: "Retrace",
            synopsis:
              "Rebuilding the original antenna rig from memory turns up a detail the founding members apparently left out of every report.",
            durationMinutes: 25,
          },
          {
            episodeNumber: 3,
            title: "The Archive",
            synopsis:
              "A records request to the engineering department's archive surfaces a near-identical project from thirty years earlier — abandoned for reasons unlisted.",
            durationMinutes: 26,
          },
          {
            episodeNumber: 4,
            title: "Interference",
            synopsis:
              "Someone outside the club starts jamming their frequency, which only confirms they're onto something real.",
            durationMinutes: 24,
          },
          {
            episodeNumber: 5,
            title: "Clear Sky",
            synopsis:
              "On the anniversary of the first payload, the club sends up one more balloon and finally gets a straight answer.",
            durationMinutes: 30,
          },
        ],
      },
    ],
  },
];
