export function formatAdminTimestamp(value: unknown, locale = "ko-KR"): string {
  if (value == null) return "—";
  if (typeof value === "object" && value !== null && "toDate" in value) {
    const d = (value as { toDate: () => Date }).toDate();
    if (!Number.isNaN(d.getTime())) return d.toLocaleString(locale);
  }
  if (typeof value === "string" || typeof value === "number") {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d.toLocaleString(locale);
  }
  return "—";
}
