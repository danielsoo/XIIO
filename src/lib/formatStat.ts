/** Compact stat display — e.g. 2400 → "2.4K", 45600 → "45.6K" */
export function formatCompactStat(value: number): string {
  const n = Math.max(0, Math.floor(value));
  if (n < 1000) return String(n);
  if (n < 1_000_000) {
    const k = n / 1000;
    return k >= 100 ? `${Math.round(k)}K` : `${Math.round(k * 10) / 10}K`.replace(/\.0K$/, "K");
  }
  const m = n / 1_000_000;
  return m >= 100 ? `${Math.round(m)}M` : `${Math.round(m * 10) / 10}M`.replace(/\.0M$/, "M");
}
