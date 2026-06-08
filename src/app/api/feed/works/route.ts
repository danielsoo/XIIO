import { NextResponse } from "next/server";
import {
  FEED_CACHE_HEADERS,
  fetchCatalogWorksFeed,
  parseCatalogSection,
} from "@/lib/server/home-feeds";
import { getDbOrNull } from "@/lib/server/works";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const sectionParam = url.searchParams.get("section") ?? url.searchParams.get("category");
  const limit = Math.min(24, Math.max(1, Number(url.searchParams.get("limit")) || 8));
  const section = parseCatalogSection(sectionParam);

  if (!section) {
    return NextResponse.json({ error: "invalid_section" }, { status: 400 });
  }

  const db = await getDbOrNull();
  if (!db) {
    return NextResponse.json({ items: [] });
  }

  const items = await fetchCatalogWorksFeed(db, section, limit);

  return NextResponse.json({ items }, { headers: FEED_CACHE_HEADERS });
}
