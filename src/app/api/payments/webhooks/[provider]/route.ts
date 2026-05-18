import { NextResponse } from "next/server";
import {
  handleStripeWebhookEvent,
  verifyStripeWebhook,
} from "@/lib/payments/providers/stripe/webhook";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;

  if (provider !== "stripe") {
    return NextResponse.json({ error: "provider_not_supported", provider }, { status: 404 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");

  try {
    const event = await verifyStripeWebhook(rawBody, signature);
    const { handled } = await handleStripeWebhookEvent(event);
    return NextResponse.json({ received: true, handled });
  } catch (e) {
    const message = e instanceof Error ? e.message : "webhook_error";
    console.error("[payments/webhook/stripe]", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
