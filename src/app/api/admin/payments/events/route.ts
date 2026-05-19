import { NextResponse } from "next/server";
import { Timestamp, type Query } from "firebase-admin/firestore";
import { jsonError, requireAdmin } from "@/lib/server/api-auth";
import {
  getEnabledPaymentProviders,
  isUploaderDepositEnabled,
} from "@/lib/payments/config";
import { parsePaymentEventDoc } from "@/lib/server/payment-events";
import { parseUserProfileDoc } from "@/lib/userAccess";
import { getDbOrNull } from "@/lib/server/works";
import type {
  AdminPaymentEventListItem,
  AdminPaymentEventsListResponse,
} from "@/types/admin";

function encodeCursor(processedAt: Timestamp, eventId: string): string {
  return Buffer.from(`${processedAt.toMillis()},${eventId}`, "utf8").toString(
    "base64url"
  );
}

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  const db = await getDbOrNull();
  if (!db) {
    return jsonError("admin_not_configured", "서버 DB를 사용할 수 없습니다.", 503);
  }

  const url = new URL(request.url);
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit")) || 25));
  const cursorParam = url.searchParams.get("cursor")?.trim() || null;
  const provider = url.searchParams.get("provider")?.trim() || null;
  const uid = url.searchParams.get("uid")?.trim() || null;

  let query: Query = db.collection("paymentEvents");
  if (provider) {
    query = query.where("provider", "==", provider);
  }
  if (uid) {
    query = query.where("uid", "==", uid);
  }
  query = query.orderBy("processedAt", "desc");

  if (cursorParam) {
    try {
      const raw = Buffer.from(cursorParam, "base64url").toString("utf8");
      const idx = raw.lastIndexOf(",");
      if (idx >= 0) {
        const eventId = raw.slice(idx + 1);
        const cursorSnap = await db.collection("paymentEvents").doc(eventId).get();
        if (cursorSnap.exists) {
          query = query.startAfter(cursorSnap);
        }
      }
    } catch {
      /* ignore bad cursor */
    }
  }

  const snap = await query.limit(limit + 1).get();
  const docs = snap.docs;
  const hasMore = docs.length > limit;
  const pageDocs = hasMore ? docs.slice(0, limit) : docs;

  const billingCache = new Map<string, boolean>();

  const items: AdminPaymentEventListItem[] = await Promise.all(
    pageDocs.map(async (doc) => {
      const event = parsePaymentEventDoc(doc.id, doc.data() as Record<string, unknown>);

      let depositVerified = billingCache.get(event.uid);
      if (depositVerified === undefined) {
        const billingSnap = await db
          .collection("users")
          .doc(event.uid)
          .collection("private")
          .doc("billing")
          .get();
        depositVerified =
          billingSnap.exists && !!billingSnap.data()?.depositVerified;
        billingCache.set(event.uid, depositVerified);
      }

      const userSnap = await db.collection("users").doc(event.uid).get();
      const profile = userSnap.exists
        ? parseUserProfileDoc(userSnap.data() as Record<string, unknown>)
        : null;

      return {
        id: doc.id,
        uid: event.uid,
        displayName: profile?.displayName ?? event.uid,
        email: profile?.email ?? null,
        provider: event.provider,
        amountMinor: event.amountMinor,
        currency: event.currency,
        processedAt: event.processedAt,
        depositVerified,
      };
    })
  );

  let nextCursor: string | null = null;
  if (hasMore && pageDocs.length > 0) {
    const last = pageDocs[pageDocs.length - 1]!;
    const processedAt = last.data().processedAt;
    if (processedAt instanceof Timestamp) {
      nextCursor = encodeCursor(processedAt, last.id);
    }
  }

  const payload: AdminPaymentEventsListResponse = {
    items,
    nextCursor,
    meta: {
      depositEnabled: isUploaderDepositEnabled(),
      providers: getEnabledPaymentProviders(),
    },
  };
  return NextResponse.json(payload);
}
