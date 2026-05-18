import { registerPaymentProvider } from "./registry";
import { createStripeDepositSession } from "./providers/stripe/session";
import type { CreateDepositSessionInput, CreateDepositSessionResult } from "./types";

registerPaymentProvider({
  id: "stripe",
  createUploaderDepositSession: createStripeDepositSession,
});

registerPaymentProvider({
  id: "toss",
  async createUploaderDepositSession(_input: CreateDepositSessionInput): Promise<CreateDepositSessionResult> {
    throw new Error("Toss provider not implemented — set PAYMENT_PROVIDERS_ENABLED=stripe for MVP");
  },
});
