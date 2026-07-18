/** Small deterministic mock-content banks for Watch page sections with no real backing data yet (Production Journal, Reviews, Details fields). Seeded per work id so content is stable across renders/visits. */

function hashStringToInt(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i++) h = (h * 31 + value.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export type ProductionJournalEntry = { date: string; text: string };

const JOURNAL_TEMPLATES = [
  "Locked the final cut after three passes — the opening sequence lost two minutes and gained everything.",
  "Color grading wrapped this week. Leaning warmer than the original reference stills, and it's the right call.",
  "Sound mix notes came back clean. One more pass on the dialogue levels in reel two and we're done.",
  "Reshot the final scene — the light wasn't right the first time, and it mattered more than we expected.",
  "Picture lock. Everything after this is polish.",
  "First test screening tonight. Taking notes, not making changes yet.",
];

export function productionJournalFor(workId: string): ProductionJournalEntry[] {
  const seed = hashStringToInt(workId);
  const base = new Date(2025, 9, 1).getTime();
  return [0, 1, 2].map((i) => {
    const text = JOURNAL_TEMPLATES[(seed + i) % JOURNAL_TEMPLATES.length]!;
    const date = new Date(base + (seed % 20) * 86_400_000 + i * 9 * 86_400_000);
    return {
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      text,
    };
  });
}

export type MockReview = { name: string; time: string; stars: string; text: string };

const REVIEWER_NAMES = ["J. Alvarez", "S. Reyes", "M. Okafor", "T. Lindqvist", "P. Choi", "R. Novak"];
const REVIEW_TEMPLATES = [
  "Confident, unhurried filmmaking — the kind that trusts a quiet scene to do the work.",
  "The craft here is way ahead of the runtime. Genuinely didn't expect to feel this much.",
  "A little rough around the edges, but the performances carry it the whole way through.",
  "Sharp editing, stronger second half. Curious to see what this director does next.",
];

export function reviewsFor(workId: string): MockReview[] {
  const seed = hashStringToInt(workId);
  return [0, 1, 2].map((i) => {
    const starsCount = 4 + ((seed + i) % 2);
    return {
      name: REVIEWER_NAMES[(seed + i * 3) % REVIEWER_NAMES.length]!,
      time: `${((seed + i * 7) % 6) + 1}d ago`,
      stars: "★".repeat(starsCount) + "☆".repeat(5 - starsCount),
      text: REVIEW_TEMPLATES[(seed + i * 5) % REVIEW_TEMPLATES.length]!,
    };
  });
}

const LANGUAGES = ["English", "Korean", "English (Korean subtitles)", "Spanish"];
const LOCATIONS = [
  "Los Angeles, CA",
  "Seoul, South Korea",
  "Portland, OR",
  "New York, NY",
  "Busan, South Korea",
  "Vancouver, BC",
];

export function languageFor(workId: string): string {
  return LANGUAGES[hashStringToInt(workId) % LANGUAGES.length]!;
}

export function filmingLocationFor(workId: string): string {
  return LOCATIONS[hashStringToInt(`loc-${workId}`) % LOCATIONS.length]!;
}

export function releaseDateFor(workId: string): string {
  const seed = hashStringToInt(`rel-${workId}`);
  const base = new Date(2025, 0, 1).getTime();
  const date = new Date(base + (seed % 500) * 86_400_000);
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}
