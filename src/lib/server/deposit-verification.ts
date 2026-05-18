import { FieldValue } from "firebase-admin/firestore";
import { getAdminAuth, getAdminDb } from "@/lib/server/firebase-admin";
import { DEPOSIT_VERIFIED_CLAIM } from "@/lib/payments/constants";
import type { PaymentProviderId } from "@/lib/payments/types";

export type GrantDepositInput = {
  uid: string;
  provider: PaymentProviderId;
  providerEventId: string;
  amountMinor?: number;
  currency?: string;
};

/**
 * Idempotent: same providerEventId will not double-grant.
 * Only call from verified payment webhooks (never from client).
 */
export async function grantDepositVerified(input: GrantDepositInput): Promise<"granted" | "already_processed"> {
  const auth = getAdminAuth();
  const db = getAdminDb();
  if (!auth || !db) {
    throw new Error("Firebase Admin not configured");
  }

  const eventRef = db.collection("paymentEvents").doc(input.providerEventId);

  const result = await db.runTransaction(async (tx) => {
    const existing = await tx.get(eventRef);
    if (existing.exists) {
      return "already_processed" as const;
    }

    tx.set(eventRef, {
      uid: input.uid,
      provider: input.provider,
      providerEventId: input.providerEventId,
      amountMinor: input.amountMinor ?? null,
      currency: input.currency ?? null,
      processedAt: FieldValue.serverTimestamp(),
    });

    tx.set(
      db.collection("users").doc(input.uid).collection("private").doc("billing"),
      {
        depositVerified: true,
        provider: input.provider,
        lastProviderEventId: input.providerEventId,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return "granted" as const;
  });

  if (result === "granted") {
    const user = await auth.getUser(input.uid);
    const existing = (user.customClaims ?? {}) as Record<string, unknown>;
    await auth.setCustomUserClaims(input.uid, {
      ...existing,
      [DEPOSIT_VERIFIED_CLAIM]: true,
    });
  }

  return result;
}

export async function hasDepositVerifiedClaim(uid: string): Promise<boolean> {
  const auth = getAdminAuth();
  if (!auth) return false;
  try {
    const user = await auth.getUser(uid);
    const claims = user.customClaims ?? {};
    return claims[DEPOSIT_VERIFIED_CLAIM] === true || claims.uploaderDepositVerified === true;
  } catch {
    return false;
  }
}
