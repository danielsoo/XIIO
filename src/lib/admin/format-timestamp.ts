function readSecondsFromObject(obj: Record<string, unknown>): number | null {
  for (const key of ["_seconds", "seconds"] as const) {
    const raw = obj[key];
    if (typeof raw === "number" && Number.isFinite(raw)) return raw;
    if (typeof raw === "string" && raw !== "") {
      const n = Number(raw);
      if (Number.isFinite(n)) return n;
    }
  }
  return null;
}

/** Parse Firestore/client timestamps, JSON `{_seconds}`, ISO strings, epoch numbers. */
export function parseAdminTimestampToDate(value: unknown): Date | null {
  if (value == null) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === "object") {
    if ("toDate" in value && typeof (value as { toDate: () => Date }).toDate === "function") {
      const d = (value as { toDate: () => Date }).toDate();
      return Number.isNaN(d.getTime()) ? null : d;
    }

    const sec = readSecondsFromObject(value as Record<string, unknown>);
    if (sec != null) {
      const obj = value as Record<string, unknown>;
      const nanoRaw = obj._nanoseconds ?? obj.nanoseconds;
      const nanoMs =
        typeof nanoRaw === "number" && Number.isFinite(nanoRaw)
          ? Math.floor(nanoRaw / 1_000_000)
          : 0;
      const d = new Date(sec * 1000 + nanoMs);
      return Number.isNaN(d.getTime()) ? null : d;
    }
  }

  if (typeof value === "string" || typeof value === "number") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  return null;
}

export function adminTimestampToMillis(value: unknown): number | null {
  const d = parseAdminTimestampToDate(value);
  return d ? d.getTime() : null;
}

export function formatAdminTimestamp(value: unknown, locale = "ko-KR"): string {
  const d = parseAdminTimestampToDate(value);
  if (!d) return "—";
  return d.toLocaleString(locale);
}
