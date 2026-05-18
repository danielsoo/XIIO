import type { PaymentProviderId, PaymentRegion } from "./types";

export function isUploaderDepositEnabled(): boolean {
  return process.env.UPLOADER_DEPOSIT_ENABLED === "true" || process.env.UPLOADER_DEPOSIT_ENABLED === "1";
}

export function getEnabledPaymentProviders(): PaymentProviderId[] {
  const raw = process.env.PAYMENT_PROVIDERS_ENABLED ?? "stripe";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean) as PaymentProviderId[];
}

function defaultProviderForRegion(region: PaymentRegion): PaymentProviderId | null {
  const mapRaw = process.env.DEFAULT_PROVIDER_BY_REGION;
  if (mapRaw) {
    try {
      const map = JSON.parse(mapRaw) as Record<string, string>;
      const key = region === "AUTO" ? "INTL" : region;
      const id = map[key];
      if (id) return id as PaymentProviderId;
    } catch {
      /* ignore */
    }
  }
  if (region === "KR") return "toss";
  return "stripe";
}

export function resolveProviderForRegion(region: PaymentRegion): PaymentProviderId | null {
  const enabled = getEnabledPaymentProviders();
  const preferred = defaultProviderForRegion(region);
  if (preferred && enabled.includes(preferred)) return preferred;
  return enabled[0] ?? null;
}
