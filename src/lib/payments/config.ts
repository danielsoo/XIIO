import type { PaymentProviderId, PaymentRegion } from "./types";

/** 테스트 기간: true면 env와 관계없이 업로더 보증금 비활성. 정식 오픈 시 false로 변경. */
const UPLOADER_DEPOSIT_FORCE_DISABLED = true;

export function isUploaderDepositEnabled(): boolean {
  if (UPLOADER_DEPOSIT_FORCE_DISABLED) return false;
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
