import { Timestamp, type Query } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { jsonError, requireAdmin } from "@/lib/server/api-auth";
import { parseErrorReportDoc } from "@/lib/server/error-reports";
import { getDbOrNull } from "@/lib/server/works";
import { parseUserProfileDoc } from "@/lib/userAccess";
import type {
  AdminErrorReportListItem,
  AdminErrorReportsListResponse,
} from "@/types/error-report";

function encodeCursor(createdAt: Timestamp, reportId: string): string {
  return Buffer.from(`${createdAt.toMillis()},${reportId}`, "utf8").toString("base64url");
}

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  const db = await getDbOrNull();
  if (!db) return jsonError("admin_not_configured", "서버 DB를 사용할 수 없습니다.", 503);

  const url = new URL(request.url);
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit")) || 25));
  const queue = url.searchParams.get("queue") === "resolved" ? "resolved" : "pending";
  const cursorParam = url.searchParams.get("cursor")?.trim() || null;

  let query: Query = db
    .collection("errorReports")
    .where("status", "==", queue)
    .orderBy("createdAt", "desc");

  if (cursorParam) {
    try {
      const raw = Buffer.from(cursorParam, "base64url").toString("utf8");
      const reportId = raw.slice(raw.lastIndexOf(",") + 1);
      const cursorSnap = await db.collection("errorReports").doc(reportId).get();
      if (cursorSnap.exists) query = query.startAfter(cursorSnap);
    } catch {
      /* Ignore malformed cursors. */
    }
  }

  const snap = await query.limit(limit + 1).get();
  const hasMore = snap.docs.length > limit;
  const docs = hasMore ? snap.docs.slice(0, limit) : snap.docs;
  const items: AdminErrorReportListItem[] = await Promise.all(
    docs.map(async (doc) => {
      const report = parseErrorReportDoc(doc.data() as Record<string, unknown>);
      const userSnap = await db.collection("users").doc(report.reporterUid).get();
      const profile = userSnap.exists
        ? parseUserProfileDoc(userSnap.data() as Record<string, unknown>)
        : null;
      return {
        id: doc.id,
        ...report,
        reporterName: profile?.displayName ?? report.reporterUid,
      };
    })
  );

  const lastDoc = docs.at(-1);
  const createdAt = lastDoc?.get("createdAt");
  const nextCursor =
    hasMore && lastDoc && createdAt instanceof Timestamp
      ? encodeCursor(createdAt, lastDoc.id)
      : null;

  const payload: AdminErrorReportsListResponse = { items, nextCursor };
  return NextResponse.json(payload);
}
