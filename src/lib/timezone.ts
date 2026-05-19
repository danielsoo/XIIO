export const TIMEZONE_IDS = ["auto", "korea", "us_eastern", "us_pacific", "utc"] as const;

export type XiioTimezoneId = (typeof TIMEZONE_IDS)[number];

const STORAGE_KEY = "xiio_timezone";

const IANA_BY_ID: Record<Exclude<XiioTimezoneId, "auto">, string> = {
  korea: "Asia/Seoul",
  us_eastern: "America/New_York",
  us_pacific: "America/Los_Angeles",
  utc: "UTC",
};

export function isXiioTimezoneId(value: string): value is XiioTimezoneId {
  return (TIMEZONE_IDS as readonly string[]).includes(value);
}

export function getStoredTimezone(): XiioTimezoneId {
  if (typeof window === "undefined") return "korea";
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw && isXiioTimezoneId(raw)) return raw;
  return "korea";
}

export function setStoredTimezone(id: XiioTimezoneId): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, id);
}

export function resolveTimezoneIana(id: XiioTimezoneId): string {
  if (id === "auto") {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Seoul";
    } catch {
      return "Asia/Seoul";
    }
  }
  return IANA_BY_ID[id];
}

export function dateLocaleForAppLocale(locale: "ko" | "en"): string {
  return locale === "en" ? "en-US" : "ko-KR";
}

/** Short label shown after formatted date-times (e.g. KST, EST, PDT). */
export function formatTimezoneAbbrev(iana: string, locale: string, at: Date): string {
  if (iana === "Asia/Seoul") return "KST";
  if (iana === "UTC") return "UTC";

  try {
    const part = new Intl.DateTimeFormat(locale, {
      timeZone: iana,
      timeZoneName: "short",
    })
      .formatToParts(at)
      .find((p) => p.type === "timeZoneName");
    if (part?.value) return part.value;
  } catch {
    /* fall through */
  }

  if (iana === "America/New_York") return locale.startsWith("en") ? "ET" : "동부(ET)";
  if (iana === "America/Los_Angeles") return locale.startsWith("en") ? "PT" : "서부(PT)";

  return iana;
}
