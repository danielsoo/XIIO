import { NextResponse } from "next/server";
import { jsonError, requireAdmin } from "@/lib/server/api-auth";
import {
  ACTIVITY_LIMITATION_KEYS,
  aggregateUserActivity,
} from "@/lib/server/user-activity-timeline";
import { getDbOrNull } from "@/lib/server/works";
import type {
  AdminUserActivityCategory,
  AdminUserActivityResponse,
} from "@/types/admin";

type Params = { params: Promise<{ uid: string }> };

const CATEGORIES: AdminUserActivityCategory[] = [
  "all",
  "payments",
  "reports",
  "content",
  "engagement",
];

export async function GET(request: Request, { params }: Params) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  const { uid } = await params;
  const db = await getDbOrNull();
  if (!db) {
    return jsonError("admin_not_configured", "서버 DB를 사용할 수 없습니다.", 503);
  }

  const userSnap = await db.collection("users").doc(uid).get();
  if (!userSnap.exists) {
    return jsonError("not_found", "회원을 찾을 수 없습니다.", 404);
  }

  const url = new URL(request.url);
  const limit = Math.min(80, Math.max(1, Number(url.searchParams.get("limit")) || 40));
  const cursor = url.searchParams.get("cursor")?.trim() || null;
  const rawCategory = url.searchParams.get("category")?.trim() ?? "all";
  const category = CATEGORIES.includes(rawCategory as AdminUserActivityCategory)
    ? (rawCategory as AdminUserActivityCategory)
    : "all";

  const { items, nextCursor } = await aggregateUserActivity(db, uid, {
    category,
    limit,
    cursor,
  });

  const payload: AdminUserActivityResponse = {
    items,
    nextCursor,
    limitations: [...ACTIVITY_LIMITATION_KEYS],
  };

  return NextResponse.json(payload);
}
