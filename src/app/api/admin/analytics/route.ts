import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/api-auth";
import { getAdminOperationsAnalytics } from "@/lib/server/platform-analytics";
import { getDbOrNull } from "@/lib/server/works";
import type { AdminAnalyticsRange } from "@/types/admin-analytics";

export const dynamic = "force-dynamic";

function parseRange(value: string | null): AdminAnalyticsRange {
  return value === "7d" || value === "30d" ? value : "24h";
}

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  const db = await getDbOrNull();
  if (!db) {
    return NextResponse.json({ error: "Platform analytics is unavailable." }, { status: 503 });
  }

  try {
    const range = parseRange(new URL(request.url).searchParams.get("range"));
    const payload = await getAdminOperationsAnalytics(db, range);
    return NextResponse.json(payload, {
      headers: { "Cache-Control": "private, no-store, max-age=0" },
    });
  } catch (error) {
    console.error("[admin/analytics]", error);
    return NextResponse.json({ error: "Unable to load operations analytics." }, { status: 500 });
  }
}

