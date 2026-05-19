import { NextResponse } from "next/server";
import { Timestamp, type Query } from "firebase-admin/firestore";
import { resolvePlaybackUrl } from "@/lib/cloudflare/stream";
import { jsonError, requireAdmin } from "@/lib/server/api-auth";
import { parseReportDoc } from "@/lib/server/reports";
import { parseUserProfileDoc } from "@/lib/userAccess";
import {
  getDbOrNull,
  parsePromoDoc,
  parseWorkDoc,
  promoRef,
  worksCol,
} from "@/lib/server/works";
import type { AdminReportListItem, AdminReportsListResponse } from "@/types/admin";
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
  const cursorParam = url.searchParams.get("cursor")?.trim() || null;
  const queue = url.searchParams.get("queue")?.trim() ?? "pending";

  let query: Query = db.collection("reports");
  if (queue === "resolved") {
    query = query.where("status", "in", ["dismissed", "action_taken"]);
  } else {
    query = query.where("status", "==", "pending");
  }
  query = query.orderBy("createdAt", "desc");

  if (cursorParam) {
    try {
      const raw = Buffer.from(cursorParam, "base64url").toString("utf8");
      const idx = raw.lastIndexOf(",");
      if (idx >= 0) {
        const reportId = raw.slice(idx + 1);
        const cursorSnap = await db.collection("reports").doc(reportId).get();
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

  const items: AdminReportListItem[] = await Promise.all(
    pageDocs.map(async (doc) => {
      const report = parseReportDoc(doc.data() as Record<string, unknown>);
      let targetTitle = report.targetWorkId;
      let playbackUrl: string | undefined;

      if (report.targetType === "full") {
        const workSnap = await worksCol(db, report.targetOwnerUid)
          .doc(report.targetWorkId)
          .get();
        if (workSnap.exists) {
          const work = parseWorkDoc(report.targetWorkId, workSnap.data() as Record<string, unknown>);
          targetTitle = work.title;
          if (work.streamUid && work.streamStatus === "ready") {
            playbackUrl = (await resolvePlaybackUrl(work.streamUid)) ?? undefined;
          }
        }
      } else {
        const promoSnap = await promoRef(db, report.targetOwnerUid, report.targetWorkId).get();
        if (promoSnap.exists) {
          const promo = parsePromoDoc(promoSnap.data() as Record<string, unknown>);
          targetTitle = promo.title ?? targetTitle;
          if (promo.streamUid && promo.streamStatus === "ready") {
            playbackUrl = (await resolvePlaybackUrl(promo.streamUid)) ?? undefined;
          }
        }
        const workSnap = await worksCol(db, report.targetOwnerUid)
          .doc(report.targetWorkId)
          .get();
        if (workSnap.exists && targetTitle === report.targetWorkId) {
          const work = parseWorkDoc(report.targetWorkId, workSnap.data() as Record<string, unknown>);
          targetTitle = work.title;
        }
      }

      const reporterSnap = await db.collection("users").doc(report.reporterUid).get();
      const reporterProfile = reporterSnap.exists
        ? parseUserProfileDoc(reporterSnap.data() as Record<string, unknown>)
        : null;

      return {
        id: doc.id,
        targetType: report.targetType,
        targetOwnerUid: report.targetOwnerUid,
        targetWorkId: report.targetWorkId,
        targetTitle,
        reporterUid: report.reporterUid,
        reporterName: reporterProfile?.displayName ?? report.reporterUid,
        reporterEmail: report.reporterEmail ?? reporterProfile?.email ?? null,
        reasonCode: report.reasonCode,
        reasonDetail: report.reasonDetail,
        status: report.status,
        createdAt: report.createdAt,
        resolvedAt: report.resolvedAt,
        adminNote: report.adminNote,
        playbackUrl,
      };
    })
  );

  let nextCursor: string | null = null;
  if (hasMore && pageDocs.length > 0) {
    const last = pageDocs[pageDocs.length - 1]!;
    const createdAt = last.data().createdAt;
    if (createdAt instanceof Timestamp) {
      nextCursor = encodeCursor(createdAt, last.id);
    }
  }

  const payload: AdminReportsListResponse = { items, nextCursor };
  return NextResponse.json(payload);
}
