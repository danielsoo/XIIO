import { NextResponse } from "next/server";
import { getStreamVideo } from "@/lib/cloudflare/stream";
import { syncWorkStreamStatusIfNeeded } from "@/lib/server/sync-stream-status";
import { getDbOrNull, parseWorkDoc } from "@/lib/server/works";
import type { CatalogFeedItem, WorkSection } from "@/types/work";
import { isWorkSection } from "@/lib/works/constants";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const sectionParam = url.searchParams.get("section") ?? url.searchParams.get("category");
  const limit = Math.min(24, Math.max(1, Number(url.searchParams.get("limit")) || 8));

  if (!sectionParam || !isWorkSection(sectionParam)) {
    return NextResponse.json({ error: "invalid_section" }, { status: 400 });
  }

  const section = sectionParam as WorkSection;
  const db = await getDbOrNull();
  if (!db) {
    return NextResponse.json({ items: [] });
  }

  const snap = await db
    .collectionGroup("works")
    .where("platformStatus", "==", "published")
    .limit(80)
    .get();

  const items: CatalogFeedItem[] = [];

  for (const doc of snap.docs) {
    if (items.length >= limit) break;

    const ownerUid = doc.ref.parent.parent?.id;
    if (!ownerUid) continue;

    let work = parseWorkDoc(doc.id, doc.data() as Record<string, unknown>);
    if (work.section !== section) continue;
    if (work.streamUid) {
      const synced = await syncWorkStreamStatusIfNeeded(
        db,
        ownerUid,
        doc.id,
        work.streamUid,
        work.streamStatus
      );
      work = { ...work, streamStatus: synced };
    }
    if (work.streamStatus !== "ready") continue;

    let thumbnailUrl: string | undefined;
    if (work.streamUid) {
      const info = await getStreamVideo(work.streamUid);
      thumbnailUrl = info?.thumbnail;
    }

    items.push({
      id: `${ownerUid}_${doc.id}`,
      workId: doc.id,
      ownerUid,
      title: work.title,
      director: work.director,
      section: work.section,
      approvedCategory: work.approvedCategory,
      approvedTags: work.approvedTags ?? [],
      thumbnailUrl,
    });
  }

  items.sort((a, b) => a.title.localeCompare(b.title));

  return NextResponse.json({ items });
}
