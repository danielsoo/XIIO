import { NextResponse } from "next/server";
import "@/lib/payments/init-registry";
import { isUploaderDepositEnabled, resolveProviderForRegion } from "@/lib/payments/config";
import { getPaymentProvider } from "@/lib/payments/registry";
import { verifyBearerIdToken } from "@/lib/server/firebase-admin";
import type { PaymentRegion } from "@/lib/payments/types";

export async function POST(request: Request) {
  if (!isUploaderDepositEnabled()) {
    return NextResponse.json({ error: "deposit_disabled" }, { status: 503 });
  }

  const session = await verifyBearerIdToken(request.headers.get("authorization"));
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { region?: PaymentRegion; returnUrl?: string; cancelUrl?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    body = {};
  }

  const region = body.region ?? "AUTO";
  const returnUrl = body.returnUrl ?? `${new URL(request.url).origin}/uploader/verify?status=success`;
  const cancelUrl = body.cancelUrl ?? `${new URL(request.url).origin}/uploader/verify?status=cancel`;

  const providerId = resolveProviderForRegion(region);
  if (!providerId) {
    return NextResponse.json({ error: "no_payment_provider" }, { status: 503 });
  }

  const provider = getPaymentProvider(providerId);
  if (!provider) {
    return NextResponse.json({ error: "provider_not_registered", provider: providerId }, { status: 503 });
  }

  try {
    const result = await provider.createUploaderDepositSession({
      uid: session.uid,
      region,
      returnUrl,
      cancelUrl,
    });
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "session_error";
    return NextResponse.json({ error: message }, { status: 501 });
  }
}
