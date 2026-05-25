import {
  PROFILE_ROLE_TAGS,
  PROFESSIONAL_FIELDS,
  type ProfessionalField,
  type ProfileRoleTag,
} from "@/types/portfolio";

export function isProfileRoleTag(v: string): v is ProfileRoleTag {
  return (PROFILE_ROLE_TAGS as readonly string[]).includes(v);
}

export function parseRoleTags(value: unknown): ProfileRoleTag[] {
  if (!Array.isArray(value)) return [];
  const out: ProfileRoleTag[] = [];
  for (const x of value) {
    const s = String(x).trim();
    if (isProfileRoleTag(s) && !out.includes(s)) out.push(s);
    if (out.length >= 3) break;
  }
  return out;
}

/** 레거시 primaryField → roleTags */
export function roleTagsFromPrimaryField(pf: ProfessionalField | undefined): ProfileRoleTag[] {
  if (!pf || pf === "multi") return [...PROFILE_ROLE_TAGS];
  if (pf === "director" || pf === "actor" || pf === "crew") return [pf];
  return [];
}

export function resolveRoleTags(data: {
  roleTags?: unknown;
  primaryField?: unknown;
}): ProfileRoleTag[] {
  const parsed = parseRoleTags(data.roleTags);
  if (parsed.length > 0) return parsed;
  const pf = data.primaryField;
  if (typeof pf === "string" && (PROFESSIONAL_FIELDS as readonly string[]).includes(pf)) {
    return roleTagsFromPrimaryField(pf as ProfessionalField);
  }
  return [];
}

export function normalizeRoleTagsInput(value: unknown): ProfileRoleTag[] {
  if (!Array.isArray(value)) return [];
  return parseRoleTags(value);
}
