export const PROFILE_SECTION_IDS = [
  "about",
  "displayName",
  "handle",
  "discover",
  "portfolio",
  "preview",
] as const;

export type ProfileSectionId = (typeof PROFILE_SECTION_IDS)[number];

export function parseProfileSection(raw: string | null): ProfileSectionId {
  if (raw && PROFILE_SECTION_IDS.includes(raw as ProfileSectionId)) {
    return raw as ProfileSectionId;
  }
  return "about";
}
