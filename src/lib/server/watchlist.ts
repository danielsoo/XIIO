import { FieldValue, type Firestore, type Timestamp } from "firebase-admin/firestore";
import { syncWorkStreamStatusIfNeeded } from "@/lib/server/sync-stream-status";
import {
  parsePromoDoc,
  parseWorkDoc,
  promoRef,
  resolveWorkListThumbnailUrl,
  worksCol,
} from "@/lib/server/works";
import type { CatalogFeedItem } from "@/types/work";

const MAX_ITEMS = 50;

function privateCol(db: Firestore, uid: string) {
  return db.collection("users").doc(uid).collection("private");
}

function saveRef(db: Firestore, uid: string, ownerUid: string, workId: string) {
  const safe = `${ownerUid}_${workId}`.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 120);
  return privateCol(db, uid).doc(`save_${safe}`);
}

function timestampMs(value: unknown): number {
  if (value && typeof value === "object" && "toMillis" in value) {
    return (value as Timestamp).toMillis();
  }
  if (value instanceof Date) return value.getTime();
  return 0;
}

async function assertWatchlistWork(db: Firestore, ownerUid: string, workId: string) {
  const workSnap = await worksCol(db, ownerUid).doc(workId).get();
  if (!workSnap.exists) return { ok: false as const, error: "not_found" };
  let work = parseWorkDoc(workId, workSnap.data() as Record<string, unknown>);
  if (work.platformStatus !== "published") return { ok: false as const, error: "not_published" };
  if (work.streamUid) {
    const synced = await syncWorkStreamStatusIfNeeded(
      db,
      ownerUid,
      workId,
      work.streamUid,
      work.streamStatus
    );
    work = { ...work, streamStatus: synced };
  }
  if (work.streamStatus !== "ready") return { ok: false as const, error: "not_published" };
  return { ok: true as const, work };
}

export async function isInWatchlist(
  db: Firestore,
  uid: string,
  ownerUid: string,
  workId: string
): Promise<boolean> {
  const snap = await saveRef(db, uid, ownerUid, workId).get();
  return snap.exists;
}

export async function setWatchlistItem(
  db: Firestore,
  uid: string,
  ownerUid: string,
  workId: string,
  saved: boolean
): Promise<{ ok: true; saved: boolean } | { ok: false; error: string }> {
  const published = await assertWatchlistWork(db, ownerUid, workId);
  if (!published.ok) return { ok: false, error: published.error };

  const ref = saveRef(db, uid, ownerUid, workId);
  const snap = await ref.get();
  const currentlySaved = snap.exists;

  if (saved && currentlySaved) return { ok: true, saved: true };
  if (!saved && !currentlySaved) return { ok: true, saved: false };

  if (saved) {
    await ref.set({
      ownerUid,
      workId,
      savedAt: FieldValue.serverTimestamp(),
    });
    return { ok: true, saved: true };
  }

  await ref.delete();
  return { ok: true, saved: false };
}

async function toCatalogFeedItem(
  db: Firestore,
  ownerUid: string,
  workId: string
): Promise<CatalogFeedItem | null> {
  const published = await assertWatchlistWork(db, ownerUid, workId);
  if (!published.ok) return null;

  const { work } = published;
  const thumbnailUrl = await resolveWorkListThumbnailUrl(db, ownerUid, workId, work);
  const promoSnap = await promoRef(db, ownerUid, workId).get();
  const promo = promoSnap.exists
    ? parsePromoDoc(promoSnap.data() as Record<string, unknown>)
    : null;
  const thumbnailCrop = promo?.thumbnailCrop ?? work.promoDraft?.thumbnailCrop;

  return {
    id: `${ownerUid}_${workId}`,
    workId,
    ownerUid,
    title: work.title,
    director: work.director,
    section: work.section,
    approvedCategory: work.approvedCategory,
    approvedTags: work.approvedTags ?? [],
    thumbnailUrl,
    ...(thumbnailCrop ? { thumbnailCrop } : {}),
  };
}

export async function listWatchlistItems(db: Firestore, uid: string): Promise<CatalogFeedItem[]> {
  const snap = await privateCol(db, uid).get();
  const rows: { ownerUid: string; workId: string; sortMs: number }[] = [];

  for (const doc of snap.docs) {
    if (!doc.id.startsWith("save_")) continue;
    const data = doc.data();
    const ownerUid = String(data.ownerUid ?? "");
    const workId = String(data.workId ?? "");
    if (!ownerUid || !workId) continue;
    rows.push({ ownerUid, workId, sortMs: timestampMs(data.savedAt) });
  }

  rows.sort((a, b) => b.sortMs - a.sortMs);
  const slice = rows.slice(0, MAX_ITEMS);

  const items: CatalogFeedItem[] = [];
  for (const row of slice) {
    const item = await toCatalogFeedItem(db, row.ownerUid, row.workId);
    if (item) items.push(item);
  }
  return items;
}
