/** Stripe zero-decimal currencies (amount is already in major units). */
const ZERO_DECIMAL_CURRENCIES = new Set([
  "bif",
  "clp",
  "djf",
  "gnf",
  "jpy",
  "kmf",
  "krw",
  "mga",
  "pyg",
  "rwf",
  "ugx",
  "vnd",
  "vuv",
  "xaf",
  "xof",
  "xpf",
]);

export function formatPaymentAmount(
  amountMinor: number | null | undefined,
  currency: string | null | undefined,
  locale: string
): string {
  if (amountMinor == null) return "—";
  const code = (currency ?? "usd").toLowerCase();
  const divisor = ZERO_DECIMAL_CURRENCIES.has(code) ? 1 : 100;
  const value = amountMinor / divisor;
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: code.toUpperCase(),
    }).format(value);
  } catch {
    return `${value} ${code.toUpperCase()}`;
  }
}
