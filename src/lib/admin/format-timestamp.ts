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

import { formatTimezoneAbbrev } from "@/lib/timezone";

export type FormatAdminTimestampOptions = {
  locale?: string;
  timeZone?: string;
};

export function formatAdminTimestamp(
  value: unknown,
  localeOrOptions: string | FormatAdminTimestampOptions = "ko-KR"
): string {
  const d = parseAdminTimestampToDate(value);
  if (!d) return "—";

  const opts: FormatAdminTimestampOptions =
    typeof localeOrOptions === "string" ? { locale: localeOrOptions } : localeOrOptions;

  const locale = opts.locale ?? "ko-KR";
  const timeZone =
    opts.timeZone ??
    (typeof Intl !== "undefined"
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : "Asia/Seoul");

  try {
    const dateTime = d.toLocaleString(locale, {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: locale.startsWith("en"),
    });
    const tzLabel = formatTimezoneAbbrev(timeZone, locale, d);
    return `${dateTime} (${tzLabel})`;
  } catch {
    return d.toLocaleString(locale);
  }
}
