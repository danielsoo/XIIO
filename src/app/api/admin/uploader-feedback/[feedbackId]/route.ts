import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { jsonError, requireAdmin } from "@/lib/server/api-auth";
import { getDbOrNull } from "@/lib/server/works";

export async function PATCH(request: Request, { params }: { params: Promise<{ feedbackId: string }> }) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;
  const db = await getDbOrNull();
  if (!db) return jsonError("admin_not_configured", "The database is unavailable.", 503);
  const { feedbackId } = await params;
  const body = (await request.json().catch(() => ({}))) as { adminNote?: string };
  const ref = db.collection("uploaderFeedback").doc(feedbackId);
  const snap = await ref.get();
  if (!snap.exists) return jsonError("not_found", "Feedback not found.", 404);
  await ref.update({
    status: "resolved",
    adminNote: typeof body.adminNote === "string" ? body.adminNote.trim().slice(0, 2000) : "",
    resolvedAt: FieldValue.serverTimestamp(),
    resolvedByUid: auth.session.uid,
  });
  return NextResponse.json({ ok: true });
}
