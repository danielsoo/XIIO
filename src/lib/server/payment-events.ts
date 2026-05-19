export type PaymentEventDoc = {
  uid: string;
  provider: string;
  providerEventId: string;
  amountMinor: number | null;
  currency: string | null;
  processedAt?: unknown;
};

export function parsePaymentEventDoc(
  id: string,
  data: Record<string, unknown>
): PaymentEventDoc {
  const amountRaw = data.amountMinor;
  let amountMinor: number | null = null;
  if (typeof amountRaw === "number" && Number.isFinite(amountRaw)) {
    amountMinor = amountRaw;
  }

  const currencyRaw = data.currency;
  const currency =
    typeof currencyRaw === "string"
      ? currencyRaw
      : currencyRaw === null
        ? null
        : null;

  return {
    uid: typeof data.uid === "string" ? data.uid : "",
    provider: typeof data.provider === "string" ? data.provider : "unknown",
    providerEventId:
      typeof data.providerEventId === "string" ? data.providerEventId : id,
    amountMinor,
    currency,
    processedAt: data.processedAt,
  };
}
