import { FieldValue, type Firestore, type Timestamp } from "firebase-admin/firestore";
import { assertPublishedWork, toCatalogFeedItems } from "@/lib/server/watchlist";
import type { WatchProgressItem } from "@/types/work";

const MAX_ITEMS = 20;
const MIN_POSITION_SEC = 5;
const COMPLETE_THRESHOLD = 0.95;

function privateCol(db: Firestore, uid: string) {
  return db.collection("users").doc(uid).collection("private");
}

function progressRef(db: Firestore, uid: string, ownerUid: string, workId: string) {
  const safe = `${ownerUid}_${workId}`.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 120);
  return privateCol(db, uid).doc(`progress_${safe}`);
}

function timestampMs(value: unknown): number {
  if (value && typeof value === "object" && "toMillis" in value) {
    return (value as Timestamp).toMillis();
  }
  if (value instanceof Date) return value.getTime();
  return 0;
}

export async function setWatchProgress(
  db: Firestore,
  uid: string,
  ownerUid: string,
  workId: string,
  positionSec: number,
  durationSec: number
): Promise<{ ok: true } | { ok: false; error: string }> {
  const published = await assertPublishedWork(db, ownerUid, workId);
  if (!published.ok) return { ok: false, error: published.error };

  const ref = progressRef(db, uid, ownerUid, workId);
  const clampedPosition = Math.max(0, positionSec);
  const clampedDuration = Math.max(0, durationSec);
  const isNearComplete = clampedDuration > 0 && clampedPosition / clampedDuration >= COMPLETE_THRESHOLD;

  if (clampedPosition < MIN_POSITION_SEC || isNearComplete) {
    await ref.delete();
    return { ok: true };
  }

  await ref.set({
    ownerUid,
    workId,
    positionSec: clampedPosition,
    durationSec: clampedDuration,
    updatedAt: FieldValue.serverTimestamp(),
  });
  return { ok: true };
}

export async function listWatchProgress(db: Firestore, uid: string): Promise<WatchProgressItem[]> {
  const snap = await privateCol(db, uid).get();
  const rows: {
    ownerUid: string;
    workId: string;
    positionSec: number;
    durationSec: number;
    sortMs: number;
  }[] = [];

  for (const doc of snap.docs) {
    if (!doc.id.startsWith("progress_")) continue;
    const data = doc.data();
    const ownerUid = String(data.ownerUid ?? "");
    const workId = String(data.workId ?? "");
    if (!ownerUid || !workId) continue;
    rows.push({
      ownerUid,
      workId,
      positionSec: Number(data.positionSec ?? 0),
      durationSec: Number(data.durationSec ?? 0),
      sortMs: timestampMs(data.updatedAt),
    });
  }

  rows.sort((a, b) => b.sortMs - a.sortMs);
  const slice = rows.slice(0, MAX_ITEMS);

  const catalogItems = await toCatalogFeedItems(db, slice);
  const progressById = new Map<string, (typeof slice)[number]>(
    slice.map((row) => [`${row.ownerUid}_${row.workId}`, row] as const)
  );

  const items: WatchProgressItem[] = [];
  for (const item of catalogItems) {
    const row = progressById.get(item.id);
    if (!row) continue;
    const progressPercent =
      row.durationSec > 0 ? Math.min(100, Math.round((row.positionSec / row.durationSec) * 100)) : 0;
    items.push({
      ...item,
      positionSec: row.positionSec,
      durationSec: row.durationSec,
      progressPercent,
    });
  }
  return items;
}
