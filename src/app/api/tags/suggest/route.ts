import { NextResponse } from "next/server";
import { requireUser } from "@/lib/server/api-auth";
import { getDbOrNull } from "@/lib/server/works";
import { collectPublishedApprovedTags, filterTagSuggestions } from "@/lib/server/tag-suggestions";

export async function GET(request: Request) {
  const auth = await requireUser(request);
  if ("error" in auth) return auth.error;

  const q = new URL(request.url).searchParams.get("q")?.trim().replace(/^#+/, "") ?? "";
  if (!q) {
    return NextResponse.json({ items: [] });
  }

  const db = await getDbOrNull();
  if (!db) {
    return NextResponse.json({ items: [] });
  }

  const catalog = await collectPublishedApprovedTags(db);
  const items = filterTagSuggestions(catalog, q);
  return NextResponse.json({ items });
}
