import { NextResponse } from "next/server";
import { getStreamThumbnailUrl } from "@/lib/cloudflare/stream";
import { getUidByHandle } from "@/lib/server/handles";
import { listEligibleWorksForUser } from "@/lib/server/portfolio";
import { getDbOrNull, parseWorkDoc, worksCol } from "@/lib/server/works";
import { parseUserProfileDoc } from "@/lib/userAccess";

type Params = { params: Promise<{ handle: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { handle } = await params;
  const db = await getDbOrNull();
  if (!db) return NextResponse.json({ error: "not_configured" }, { status: 503 });

  const uid = await getUidByHandle(db, handle);
  if (!uid) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const userSnap = await db.collection("users").doc(uid).get();
  if (!userSnap.exists) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const profile = parseUserProfileDoc(userSnap.data() as Record<string, unknown>);
  if (profile.isDiscoverable === false) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const eligible = await listEligibleWorksForUser(db, uid);
  const directed: Record<string, unknown>[] = [];
  const credited: Record<string, unknown>[] = [];
  const seenDirected = new Set<string>();

  for (const item of eligible) {
    const workSnap = await worksCol(db, item.ownerUid).doc(item.workId).get();
    if (!workSnap.exists) continue;
    const work = parseWorkDoc(item.workId, workSnap.data() as Record<string, unknown>);
    const thumb = work.streamUid ? getStreamThumbnailUrl(work.streamUid) : null;
    const key = `${item.ownerUid}:${item.workId}`;
    const entry = {
      workId: item.workId,
      ownerUid: item.ownerUid,
      title: work.title,
      section: work.section,
      director: work.director,
      role: item.role === "owner" ? "director" : item.role,
      characterName: item.characterName,
      thumbnailUrl: thumb,
      watchPath: `/watch/${item.ownerUid}/${item.workId}`,
    };
    if (item.role === "owner") {
      if (!seenDirected.has(key)) {
        seenDirected.add(key);
        directed.push(entry);
      }
    } else {
      if (!seenDirected.has(key)) credited.push(entry);
    }
  }

  return NextResponse.json({
    profile: {
      uid,
      handle: profile.handle ?? handle,
      displayName: profile.displayName,
      headline: profile.headline,
      bio: profile.bio,
      primaryField: profile.primaryField,
      defaultDirectorName: profile.defaultDirectorName,
    },
    directed,
    credited,
  });
}
