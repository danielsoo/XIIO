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
