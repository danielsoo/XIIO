/** Relative time for DM thread list (e.g. "2h", "3d"). */
export function formatDmTime(iso: string | null | undefined, locale: string): string {
  if (!iso) return "";
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return "";

  const diffSec = Math.round((ms - Date.now()) / 1000);
  const abs = Math.abs(diffSec);
  const rtf = new Intl.RelativeTimeFormat(locale.startsWith("ko") ? "ko" : "en", {
    numeric: "auto",
  });

  if (abs < 60) return rtf.format(diffSec, "second");
  if (abs < 3600) return rtf.format(Math.round(diffSec / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diffSec / 3600), "hour");
  if (abs < 604800) return rtf.format(Math.round(diffSec / 86400), "day");
  if (abs < 2592000) return rtf.format(Math.round(diffSec / 604800), "week");

  try {
    return new Date(ms).toLocaleDateString(locale.startsWith("ko") ? "ko-KR" : "en-US", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

/** Absolute clock time for a message bubble (e.g. "오후 3:24" / "3:24 PM"). */
export function formatClockTime(iso: string | null | undefined, locale: string): string {
  if (!iso) return "";
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return "";

  try {
    return new Date(ms).toLocaleTimeString(locale.startsWith("ko") ? "ko-KR" : "en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

/** True when both timestamps fall in the same calendar minute (used to group consecutive messages). */
export function isSameClockMinute(
  aIso: string | null | undefined,
  bIso: string | null | undefined
): boolean {
  if (!aIso || !bIso) return false;
  const a = Date.parse(aIso);
  const b = Date.parse(bIso);
  if (Number.isNaN(a) || Number.isNaN(b)) return false;
  return Math.floor(a / 60000) === Math.floor(b / 60000);
}
