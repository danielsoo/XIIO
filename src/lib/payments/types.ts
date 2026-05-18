export type PaymentProviderId = "stripe" | "toss" | (string & {});

export type PaymentRegion = "KR" | "INTL" | "AUTO";

export interface CreateDepositSessionInput {
  uid: string;
  region: PaymentRegion;
  returnUrl: string;
  cancelUrl?: string;
}

export interface CreateDepositSessionResult {
  provider: PaymentProviderId;
  /** Hosted checkout URL */
  url?: string;
  /** Stripe PaymentIntent client secret, etc. */
  clientSecret?: string;
}

export interface NormalizedWebhookPayment {
  uid: string;
  succeeded: boolean;
  provider: PaymentProviderId;
  providerEventId: string;
  amountMinor?: number;
  currency?: string;
}
