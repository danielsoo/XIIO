import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { jsonError, requireUser } from "@/lib/server/api-auth";
import { getDbOrNull } from "@/lib/server/works";

type ErrorReportBody = {
  errorMessage?: string;
  userDescription?: string;
  errorCode?: string;
  service?: string;
  occurredAt?: string;
  pagePath?: string;
  stepId?: string;
  uploadPhase?: string;
  locale?: string;
  userAgent?: string;
};

function clean(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export async function POST(request: Request) {
  const auth = await requireUser(request);
  if ("error" in auth) return auth.error;
  const { session } = auth;

  let body: ErrorReportBody;
  try {
    body = (await request.json()) as ErrorReportBody;
  } catch {
    return jsonError("invalid_json", "The request could not be read.", 400);
  }

  const errorMessage = clean(body.errorMessage, 2_000);
  const userDescription = clean(body.userDescription, 4_000);
  if (!errorMessage) {
    return jsonError("error_required", "Error details are required.", 400);
  }

  const db = await getDbOrNull();
  if (!db) return jsonError("admin_not_configured", "The reporting service is temporarily unavailable.", 503);

  const reportRef = await db.collection("errorReports").add({
    reporterUid: session.uid,
    reporterEmail: session.email ?? null,
    errorMessage,
    userDescription,
    errorCode: clean(body.errorCode, 120) || "UPLOAD_UNKNOWN",
    service: clean(body.service, 120) || "Uploader",
    occurredAt: clean(body.occurredAt, 80) || null,
    pagePath: clean(body.pagePath, 500),
    stepId: clean(body.stepId, 100) || null,
    uploadPhase: clean(body.uploadPhase, 100) || null,
    locale: clean(body.locale, 20) || null,
    userAgent: clean(body.userAgent, 600) || null,
    status: "pending",
    createdAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ ok: true, reportId: reportRef.id });
}
