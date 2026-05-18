const MAX_CATEGORY_LEN = 24;
const MAX_TAG_LEN = 32;
const MAX_TAGS = 8;

export function normalizeContentCategory(value: string): string {
  const s = value.trim().replace(/\s+/g, " ").slice(0, MAX_CATEGORY_LEN);
  return s;
}

export function normalizeTags(input: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of input) {
    const t = raw.trim().replace(/\s+/g, " ").slice(0, MAX_TAG_LEN);
    if (!t) continue;
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
    if (out.length >= MAX_TAGS) break;
  }
  return out;
}

export function parseTagsFromInput(text: string): string[] {
  return normalizeTags(
    text
      .split(/[,，、]/)
      .map((s) => s.trim())
      .filter(Boolean)
  );
}
