import type { ModerationFlag } from "@/types/moderation";

function flagKey(f: ModerationFlag): string {
  return f.code;
}

const SEVERITY_RANK = { low: 1, medium: 2, high: 3 } as const;

export function mergeModerationFlags(...groups: ModerationFlag[][]): ModerationFlag[] {
  const map = new Map<string, ModerationFlag>();
  for (const group of groups) {
    for (const f of group) {
      const key = flagKey(f);
      const existing = map.get(key);
      if (!existing) {
        map.set(key, { ...f });
        continue;
      }
      const keep =
        SEVERITY_RANK[f.severity] > SEVERITY_RANK[existing.severity] ||
        (f.severity === existing.severity && f.confidence > existing.confidence)
          ? f
          : existing;
      map.set(key, {
        ...keep,
        detail: [existing.detail, f.detail].filter(Boolean).join(" · ") || keep.detail,
      });
    }
  }
  return [...map.values()];
}
