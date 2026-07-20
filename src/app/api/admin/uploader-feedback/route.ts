import { Timestamp, type Query } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { jsonError, requireAdmin } from "@/lib/server/api-auth";
import { getDbOrNull } from "@/lib/server/works";
import { parseUserProfileDoc } from "@/lib/userAccess";

function clean(value: unknown) { return value == null ? "" : String(value); }

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;
  const db = await getDbOrNull();
  if (!db) return jsonError("admin_not_configured", "The database is unavailable.", 503);
  const url = new URL(request.url);
  const status = url.searchParams.get("queue") === "resolved" ? "resolved" : "pending";
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit")) || 25));
  let query: Query = db.collection("uploaderFeedback").where("status", "==", status).orderBy("createdAt", "desc");
  const snap = await query.limit(limit).get();
  const items = await Promise.all(snap.docs.map(async (doc) => {
    const data = doc.data();
    const uid = clean(data.reporterUid);
    const userSnap = uid ? await db.collection("users").doc(uid).get() : null;
    const profile = userSnap?.exists ? parseUserProfileDoc(userSnap.data() as Record<string, unknown>) : null;
    const createdAt = data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : null;
    return {
      id: doc.id,
      reporterUid: uid,
      reporterEmail: data.reporterEmail ? clean(data.reporterEmail) : null,
      reporterName: profile?.displayName ?? uid,
      category: clean(data.category),
      message: clean(data.message),
      area: data.area ? clean(data.area) : null,
      pagePath: clean(data.pagePath),
      userAgent: data.userAgent ? clean(data.userAgent) : null,
      status,
      createdAt,
      adminNote: data.adminNote ? clean(data.adminNote) : null,
    };
  }));
  return NextResponse.json({ items });
}
