import type { Firestore } from "firebase-admin/firestore";
import { parseWorkDoc } from "@/lib/server/works";

const SCAN_LIMIT = 80;
const SUGGEST_LIMIT = 8;

export async function collectPublishedApprovedTags(db: Firestore): Promise<string[]> {
  const snap = await db
    .collectionGroup("works")
    .where("platformStatus", "==", "published")
    .limit(SCAN_LIMIT)
    .get();

  const seen = new Set<string>();
  const tags: string[] = [];

  for (const doc of snap.docs) {
    const work = parseWorkDoc(doc.id, doc.data() as Record<string, unknown>);
    for (const raw of work.approvedTags ?? []) {
      const t = String(raw).trim();
      if (!t) continue;
      const key = t.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      tags.push(t);
    }
  }

  return tags;
}

export function filterTagSuggestions(catalog: string[], query: string, limit = SUGGEST_LIMIT): string[] {
  const q = query.trim().replace(/^#+/, "").toLowerCase();
  if (!q) return [];

  const matches = catalog.filter((tag) => tag.toLowerCase().startsWith(q));
  matches.sort((a, b) => {
    const aLow = a.toLowerCase();
    const bLow = b.toLowerCase();
    if (aLow.length !== bLow.length) return aLow.length - bLow.length;
    return aLow.localeCompare(bLow, "ko");
  });

  return matches.slice(0, limit);
}
