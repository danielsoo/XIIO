import Stripe from "stripe";

let stripe: Stripe | null | undefined;

export function getStripe(): Stripe | null {
  if (stripe !== undefined) return stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    stripe = null;
    return null;
  }
  stripe = new Stripe(key);
  return stripe;
}

export function getUploaderDepositAmountCents(): number {
  const raw = process.env.UPLOADER_DEPOSIT_AMOUNT_CENTS;
  const n = raw ? parseInt(raw, 10) : 100;
  return Number.isFinite(n) && n > 0 ? n : 100;
}

export function getUploaderDepositCurrency(): string {
  return (process.env.UPLOADER_DEPOSIT_CURRENCY ?? "usd").toLowerCase();
}
