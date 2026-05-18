import type Stripe from "stripe";
import { grantDepositVerified } from "@/lib/server/deposit-verification";
import type { NormalizedWebhookPayment } from "../../types";
import { getStripe } from "./client";

export async function verifyStripeWebhook(
  rawBody: string,
  signature: string | null
): Promise<Stripe.Event> {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    throw new Error("Stripe webhook not configured");
  }
  if (!signature) {
    throw new Error("Missing stripe-signature header");
  }
  return stripe.webhooks.constructEvent(rawBody, signature, secret);
}

export function normalizeStripeDepositEvent(event: Stripe.Event): NormalizedWebhookPayment | null {
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.metadata?.purpose !== "uploader_deposit") return null;
    const uid = session.metadata?.xiio_uid ?? session.client_reference_id;
    if (!uid) return null;
    return {
      uid,
      succeeded: session.payment_status === "paid" || session.status === "complete",
      provider: "stripe",
      providerEventId: event.id,
      amountMinor: session.amount_total ?? undefined,
      currency: session.currency ?? undefined,
    };
  }

  if (event.type === "payment_intent.succeeded") {
    const pi = event.data.object as Stripe.PaymentIntent;
    if (pi.metadata?.purpose !== "uploader_deposit") return null;
    const uid = pi.metadata?.xiio_uid;
    if (!uid) return null;
    return {
      uid,
      succeeded: true,
      provider: "stripe",
      providerEventId: event.id,
      amountMinor: pi.amount ?? undefined,
      currency: pi.currency ?? undefined,
    };
  }

  return null;
}

export async function handleStripeWebhookEvent(event: Stripe.Event): Promise<{ handled: boolean }> {
  const normalized = normalizeStripeDepositEvent(event);
  if (!normalized || !normalized.succeeded) {
    return { handled: false };
  }

  await grantDepositVerified({
    uid: normalized.uid,
    provider: normalized.provider,
    providerEventId: normalized.providerEventId,
    amountMinor: normalized.amountMinor,
    currency: normalized.currency,
  });

  return { handled: true };
}
