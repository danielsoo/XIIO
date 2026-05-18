import type { PaymentProviderId } from "./types";
import { getEnabledPaymentProviders } from "./config";

export type PaymentProviderModule = {
  id: PaymentProviderId;
  createUploaderDepositSession: (
    input: import("./types").CreateDepositSessionInput
  ) => Promise<import("./types").CreateDepositSessionResult>;
};

const registry = new Map<PaymentProviderId, PaymentProviderModule>();

export function registerPaymentProvider(mod: PaymentProviderModule) {
  registry.set(mod.id, mod);
}

export function getPaymentProvider(id: PaymentProviderId): PaymentProviderModule | undefined {
  return registry.get(id);
}

export function getActiveProviders(): PaymentProviderModule[] {
  const enabled = getEnabledPaymentProviders();
  return enabled.map((id) => registry.get(id)).filter(Boolean) as PaymentProviderModule[];
}
