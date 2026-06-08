import type { ProfileRoleTag } from "@/types/portfolio";

export const MOCK_SCHOOLS = [
  "Penn State University",
  "NYU Tisch School of the Arts",
  "USC School of Cinematic Arts",
  "UCLA School of Theater",
  "Columbia University",
  "Boston University",
  "Chapman University",
  "Emerson College",
] as const;

export const MOCK_INTEREST_TAGS = [
  "Narrative",
  "Coming-of-age",
  "Documentary",
  "Cinematography",
  "Editing",
  "Short Film",
  "Indie",
  "Experimental",
] as const;

export const POPULAR_INTERESTS = [
  { tag: "Short Film", count: "1.2K" },
  { tag: "Narrative", count: "842" },
  { tag: "Documentary", count: "623" },
  { tag: "Cinematography", count: "591" },
  { tag: "Editing", count: "487" },
] as const;

export const MOCK_ACTIVE_AGO = [
  "Active 2h ago",
  "Active 5h ago",
  "Active 1d ago",
  "Active 2d ago",
  "Active 3d ago",
] as const;

export type SocietySortId = "recent" | "name";

export const SOCIETY_SORT_OPTIONS: { id: SocietySortId; labelKey: string }[] = [
  { id: "recent", labelKey: "society.sortRecent" },
  { id: "name", labelKey: "society.sortName" },
];

function hashSeed(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) >>> 0;
  return h;
}

export function mockSchoolForUid(uid: string): string {
  return MOCK_SCHOOLS[hashSeed(uid) % MOCK_SCHOOLS.length]!;
}

export function mockActiveAgoForUid(uid: string): string {
  return MOCK_ACTIVE_AGO[hashSeed(`${uid}:active`) % MOCK_ACTIVE_AGO.length]!;
}

export function mockTagsForPerson(
  uid: string,
  roleTags: ProfileRoleTag[],
  headline?: string
): string[] {
  const tags = new Set<string>();
  for (const r of roleTags) {
    if (r === "director") tags.add("Narrative");
    if (r === "actor") tags.add("Coming-of-age");
    if (r === "crew") tags.add("Cinematography");
  }
  const hay = (headline ?? "").toLowerCase();
  if (hay.includes("documentary")) tags.add("Documentary");
  if (hay.includes("short")) tags.add("Short Film");
  if (hay.includes("edit")) tags.add("Editing");

  let i = 0;
  while (tags.size < 2 && i < MOCK_INTEREST_TAGS.length) {
    tags.add(MOCK_INTEREST_TAGS[(hashSeed(uid) + i) % MOCK_INTEREST_TAGS.length]!);
    i++;
  }
  return [...tags].slice(0, 3);
}

export function primaryRoleLabelKey(roleTags: ProfileRoleTag[]): string | null {
  if (roleTags.includes("director")) return "network.field.director";
  if (roleTags.includes("actor")) return "network.field.actor";
  if (roleTags.includes("crew")) return "network.field.crew";
  return null;
}
