import { NextResponse } from "next/server";
import {
  FEED_CACHE_HEADERS,
  PERSONALIZED_FEED_CACHE_HEADERS,
  fetchPromoShortsFeed,
} from "@/lib/server/home-feeds";
import { verifyBearerIdToken } from "@/lib/server/firebase-admin";
import { getDbOrNull } from "@/lib/server/works";

export async function GET(request: Request) {
  const db = await getDbOrNull();
  if (!db) {
    return NextResponse.json({ items: [] });
  }

  const session = await verifyBearerIdToken(request.headers.get("authorization"));
  const viewerUid = session?.uid ?? null;
  const items = await fetchPromoShortsFeed(db, viewerUid);

  return NextResponse.json(
    { items },
    { headers: viewerUid ? PERSONALIZED_FEED_CACHE_HEADERS : FEED_CACHE_HEADERS }
  );
}
