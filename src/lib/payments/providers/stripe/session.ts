import type { CreateDepositSessionInput, CreateDepositSessionResult } from "../../types";
import { getStripe, getUploaderDepositAmountCents, getUploaderDepositCurrency } from "./client";

export async function createStripeDepositSession(
  input: CreateDepositSessionInput
): Promise<CreateDepositSessionResult> {
  const stripe = getStripe();
  if (!stripe) {
    throw new Error("STRIPE_SECRET_KEY not configured");
  }

  const amount = getUploaderDepositAmountCents();
  const currency = getUploaderDepositCurrency();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    success_url: `${input.returnUrl}${input.returnUrl.includes("?") ? "&" : "?"}status=success`,
    cancel_url: input.cancelUrl ?? input.returnUrl,
    client_reference_id: input.uid,
    metadata: {
      xiio_uid: input.uid,
      purpose: "uploader_deposit",
    },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency,
          unit_amount: amount,
          product_data: {
            name: "XIIO 업로더 보증금",
            description: "영상 업로드 자격 확인용 소액 결제 (신원 보증 아님)",
          },
        },
      },
    ],
  });

  if (!session.url) {
    throw new Error("Stripe checkout session missing url");
  }

  return {
    provider: "stripe",
    url: session.url,
  };
}
