import { FieldValue, type Firestore } from "firebase-admin/firestore";
import type { SchoolDoc, SchoolListItem, SchoolSuggestion } from "@/types/school";

const SUGGEST_LIMIT = 8;
const SCAN_LIMIT = 500;

export function schoolsCol(db: Firestore) {
  return db.collection("schools");
}

export function schoolRef(db: Firestore, schoolId: string) {
  return schoolsCol(db).doc(schoolId);
}

export function slugifySchoolName(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function initialsFromName(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "??";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export function parseSchoolDoc(id: string, data: Record<string, unknown>): SchoolListItem {
  const name = data.name ? String(data.name) : id;
  return {
    id,
    name,
    shortName: data.shortName ? String(data.shortName) : name,
    initials: data.initials ? String(data.initials) : initialsFromName(name),
    slug: data.slug ? String(data.slug) : id,
    colorPrimary: typeof data.colorPrimary === "string" ? data.colorPrimary : "#0ea5e9",
    colorSecondary: typeof data.colorSecondary === "string" ? data.colorSecondary : "#ffffff",
    logoUrl: typeof data.logoUrl === "string" ? data.logoUrl : null,
    status: data.status === "active" || data.status === "merged" ? data.status : "pending",
    mergedIntoSlug: data.mergedIntoSlug ? String(data.mergedIntoSlug) : undefined,
    proposedBy: data.proposedBy ? String(data.proposedBy) : undefined,
    workCount: typeof data.workCount === "number" ? data.workCount : 0,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

/** 슬러그가 이미 있으면 그대로 반환, 없으면 pending 상태로 자가등록 — tag-suggest와 동일한 무차단 흐름 */
export async function getOrCreateSchool(
  db: Firestore,
  name: string,
  proposedBy: string
): Promise<SchoolListItem> {
  const trimmed = name.trim().slice(0, 120);
  const slug = slugifySchoolName(trimmed);
  if (!trimmed || !slug) throw new Error("invalid_school_name");

  const ref = schoolRef(db, slug);
  const snap = await ref.get();
  if (snap.exists) {
    return parseSchoolDoc(snap.id, snap.data() as Record<string, unknown>);
  }

  const doc: SchoolDoc = {
    name: trimmed,
    shortName: trimmed,
    initials: initialsFromName(trimmed),
    slug,
    colorPrimary: "#0ea5e9",
    colorSecondary: "#ffffff",
    logoUrl: null,
    status: "pending",
    proposedBy,
    workCount: 0,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
  await ref.set(doc);
  return { id: slug, ...doc };
}

export async function getSchoolById(db: Firestore, schoolId: string): Promise<SchoolListItem | null> {
  const snap = await schoolRef(db, schoolId).get();
  if (!snap.exists) return null;
  return parseSchoolDoc(snap.id, snap.data() as Record<string, unknown>);
}

export async function collectSchoolsForSuggestions(db: Firestore): Promise<SchoolListItem[]> {
  const snap = await schoolsCol(db).where("status", "in", ["active", "pending"]).limit(SCAN_LIMIT).get();
  return snap.docs.map((d) => parseSchoolDoc(d.id, d.data() as Record<string, unknown>));
}

export function filterSchoolSuggestions(
  catalog: SchoolListItem[],
  query: string,
  limit = SUGGEST_LIMIT
): SchoolSuggestion[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const matches = catalog.filter(
    (s) =>
      s.name.toLowerCase().includes(q) ||
      s.shortName.toLowerCase().includes(q) ||
      s.slug.includes(q)
  );

  matches.sort((a, b) => {
    const aStarts = a.name.toLowerCase().startsWith(q) || a.shortName.toLowerCase().startsWith(q);
    const bStarts = b.name.toLowerCase().startsWith(q) || b.shortName.toLowerCase().startsWith(q);
    if (aStarts !== bStarts) return aStarts ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return matches.slice(0, limit).map((s) => ({
    id: s.id,
    name: s.name,
    shortName: s.shortName,
    initials: s.initials,
    logoUrl: s.logoUrl,
    colorPrimary: s.colorPrimary,
    colorSecondary: s.colorSecondary,
  }));
}

/** 발행/삭제 시점에만 호출 — 학교별 작품 수 카운터 (school-feeds 랭킹용) */
export async function adjustSchoolWorkCount(db: Firestore, schoolId: string, delta: number): Promise<void> {
  if (!schoolId || delta === 0) return;
  const ref = schoolRef(db, schoolId);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return;
    const current = typeof snap.data()?.workCount === "number" ? (snap.data()!.workCount as number) : 0;
    tx.update(ref, { workCount: Math.max(0, current + delta), updatedAt: FieldValue.serverTimestamp() });
  });
}
