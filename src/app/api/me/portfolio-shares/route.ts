import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { jsonError, requireUser } from "@/lib/server/api-auth";
import {
  generatePortfolioToken,
  listEligibleWorksForUser,
  parsePortfolioShare,
  portfolioSharesCol,
} from "@/lib/server/portfolio";
import { getDbOrNull, parseWorkDoc, worksCol } from "@/lib/server/works";

export async function GET(request: Request) {
  const auth = await requireUser(request);
  if ("error" in auth) return auth.error;

  const db = await getDbOrNull();
  if (!db) return jsonError("admin_not_configured", "서버 DB를 사용할 수 없습니다.", 503);

  const snap = await portfolioSharesCol(db, auth.session.uid).orderBy("createdAt", "desc").get();
  const shares = snap.docs
    .map((d) => {
      const share = parsePortfolioShare(d.data() as Record<string, unknown>);
      if (!share) return null;
      return { id: d.id, ...share };
    })
    .filter(Boolean);

  const eligible = await listEligibleWorksForUser(db, auth.session.uid);
  const works = await Promise.all(
    eligible.map(async (item) => {
      const snap = await worksCol(db, item.ownerUid).doc(item.workId).get();
      if (!snap.exists) return null;
      const work = parseWorkDoc(item.workId, snap.data() as Record<string, unknown>);
      return {
        workId: item.workId,
        ownerUid: item.ownerUid,
        title: work.title,
        role: item.role,
        portfolioSubmissionHidden: work.portfolioSubmissionHidden === true,
      };
    })
  );

  return NextResponse.json({
    shares,
    eligibleWorks: works.filter(Boolean),
  });
}

export async function POST(request: Request) {
  const auth = await requireUser(request);
  if ("error" in auth) return auth.error;

  const db = await getDbOrNull();
  if (!db) return jsonError("admin_not_configured", "서버 DB를 사용할 수 없습니다.", 503);

  let body: {
    title?: string;
    includedWorkIds?: string[];
    excludedWorkIds?: string[];
    expiresInDays?: number;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return jsonError("invalid_json", "요청 형식(JSON)이 올바르지 않습니다.", 400);
  }

  const title = (body.title ?? "Portfolio").trim().slice(0, 200) || "Portfolio";
  const token = generatePortfolioToken();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";
  const shareUrl = appUrl ? `${appUrl}/p/${token}` : `/p/${token}`;

  let expiresAt: ReturnType<typeof FieldValue.serverTimestamp> | Date | null = null;
  if (body.expiresInDays && body.expiresInDays > 0) {
    const d = new Date();
    d.setDate(d.getDate() + Math.min(body.expiresInDays, 365));
    expiresAt = d;
  }

  const ref = portfolioSharesCol(db, auth.session.uid).doc();
  await ref.set({
    token,
    title,
    includedWorkIds: Array.isArray(body.includedWorkIds) ? body.includedWorkIds.map(String) : [],
    excludedWorkIds: Array.isArray(body.excludedWorkIds) ? body.excludedWorkIds.map(String) : [],
    visibility: "active",
    expiresAt,
    viewCount: 0,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({
    id: ref.id,
    token,
    title,
    shareUrl,
    includedWorkIds: body.includedWorkIds ?? [],
    excludedWorkIds: body.excludedWorkIds ?? [],
  });
}
