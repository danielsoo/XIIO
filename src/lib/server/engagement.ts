import { FieldValue, type DocumentSnapshot, type Firestore, type Transaction } from "firebase-admin/firestore";
import type { AnalyticsSummary, EngagementTarget, UploaderAnalyticsPayload, WorkAnalyticsBreakdown } from "@/types/engagement";
import { parsePromoDoc, parseWorkDoc, promoRef, worksCol } from "@/lib/server/works";

export function dayKeyUTC(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

function analyticsRef(db: Firestore, ownerUid: string) {
  return db.collection("users").doc(ownerUid).collection("private").doc("analytics");
}

function likeRef(db: Firestore, likerUid: string, ownerUid: string, workId: string) {
  const safe = `${ownerUid}_${workId}`.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 120);
  return db.collection("users").doc(likerUid).collection("private").doc(`like_promo_${safe}`);
}

function dedupRef(
  db: Firestore,
  ownerUid: string,
  target: EngagementTarget,
  workId: string,
  viewerKey: string,
  day: string
) {
  const id = `dedup_view_${target}_${workId}_${viewerKey}_${day}`
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .slice(0, 200);
  return db.collection("users").doc(ownerUid).collection("private").doc(id);
}

function bumpDayField(
  tx: Transaction,
  summarySnap: DocumentSnapshot,
  field: "likesByDay" | "viewsByDay",
  totalField: "totalLikes" | "totalViews",
  day: string,
  delta: number
) {
  const summaryRef = summarySnap.ref;
  if (delta === 0) return;

  if (!summarySnap.exists) {
    tx.set(summaryRef, {
      totalLikes: totalField === "totalLikes" ? Math.max(0, delta) : 0,
      totalViews: totalField === "totalViews" ? Math.max(0, delta) : 0,
      likesByDay: field === "likesByDay" ? { [day]: Math.max(0, delta) } : {},
      viewsByDay: field === "viewsByDay" ? { [day]: Math.max(0, delta) } : {},
      updatedAt: FieldValue.serverTimestamp(),
    });
    return;
  }

  const data = summarySnap.data() ?? {};
  const byDay = { ...((data[field] as Record<string, number>) ?? {}) };
  byDay[day] = Math.max(0, (byDay[day] ?? 0) + delta);
  const prevTotal = typeof data[totalField] === "number" ? data[totalField] : 0;

  tx.update(summaryRef, {
    [totalField]: Math.max(0, prevTotal + delta),
    [field]: byDay,
    updatedAt: FieldValue.serverTimestamp(),
  });
}

function bumpCounter(
  tx: Transaction,
  docSnap: DocumentSnapshot,
  field: "likeCount" | "viewCount",
  delta: number
) {
  if (delta === 0 || !docSnap.exists) return;
  const data = docSnap.data() ?? {};
  const current = typeof data[field] === "number" ? data[field] : 0;
  const next = Math.max(0, current + delta);
  tx.update(docSnap.ref, {
    [field]: next,
    updatedAt: FieldValue.serverTimestamp(),
  });
}

async function assertPublishedPromo(db: Firestore, ownerUid: string, workId: string) {
  const workSnap = await worksCol(db, ownerUid).doc(workId).get();
  if (!workSnap.exists) return { ok: false as const, error: "not_found" };
  const work = parseWorkDoc(workId, workSnap.data() as Record<string, unknown>);
  if (work.platformStatus !== "published") return { ok: false as const, error: "not_published" };

  const promoSnap = await promoRef(db, ownerUid, workId).get();
  if (!promoSnap.exists) return { ok: false as const, error: "not_found" };
  const promo = parsePromoDoc(promoSnap.data() as Record<string, unknown>);
  if (promo.platformStatus !== "published") return { ok: false as const, error: "not_published" };

  return {
    ok: true as const,
    workRef: workSnap.ref,
    promoRef: promoSnap.ref,
    work,
    promo,
  };
}

async function assertPublishedFull(db: Firestore, ownerUid: string, workId: string) {
  const workSnap = await worksCol(db, ownerUid).doc(workId).get();
  if (!workSnap.exists) return { ok: false as const, error: "not_found" };
  const work = parseWorkDoc(workId, workSnap.data() as Record<string, unknown>);
  if (work.platformStatus !== "published") return { ok: false as const, error: "not_published" };
  return { ok: true as const, workRef: workSnap.ref, work };
}

export async function isPromoLiked(
  db: Firestore,
  likerUid: string,
  ownerUid: string,
  workId: string
): Promise<boolean> {
  const snap = await likeRef(db, likerUid, ownerUid, workId).get();
  return snap.exists;
}

export async function setPromoLike(
  db: Firestore,
  likerUid: string,
  ownerUid: string,
  workId: string,
  liked: boolean
): Promise<{ ok: true; likeCount: number } | { ok: false; error: string }> {
  const published = await assertPublishedPromo(db, ownerUid, workId);
  if (!published.ok) return { ok: false, error: published.error };

  const day = dayKeyUTC();
  const lRef = likeRef(db, likerUid, ownerUid, workId);
  const summaryDocRef = analyticsRef(db, ownerUid);

  const result = await db.runTransaction(async (tx) => {
    const likeSnap = await tx.get(lRef);
    const summarySnap = await tx.get(summaryDocRef);
    const promoSnap = await tx.get(published.promoRef);
    const currentlyLiked = likeSnap.exists;

    if (liked && currentlyLiked) {
      const count = parsePromoDoc(promoSnap.data() as Record<string, unknown>).likeCount ?? 0;
      return { likeCount: count };
    }
    if (!liked && !currentlyLiked) {
      const count = parsePromoDoc(promoSnap.data() as Record<string, unknown>).likeCount ?? 0;
      return { likeCount: count };
    }

    if (liked) {
      tx.set(lRef, { ownerUid, workId, createdAt: FieldValue.serverTimestamp() });
      bumpCounter(tx, promoSnap, "likeCount", 1);
      bumpDayField(tx, summarySnap, "likesByDay", "totalLikes", day, 1);
    } else {
      tx.delete(lRef);
      bumpCounter(tx, promoSnap, "likeCount", -1);
      bumpDayField(tx, summarySnap, "likesByDay", "totalLikes", day, -1);
    }

    const afterPromo = await tx.get(published.promoRef);
    const count = Math.max(0, parsePromoDoc(afterPromo.data() as Record<string, unknown>).likeCount ?? 0);
    return { likeCount: count };
  });

  return { ok: true, likeCount: result.likeCount };
}

export async function recordView(
  db: Firestore,
  ownerUid: string,
  workId: string,
  target: EngagementTarget,
  viewerKey: string
): Promise<{ ok: true; recorded: boolean } | { ok: false; error: string }> {
  const day = dayKeyUTC();
  const dRef = dedupRef(db, ownerUid, target, workId, viewerKey, day);
  const summaryDocRef = analyticsRef(db, ownerUid);

  if (target === "promo") {
    const published = await assertPublishedPromo(db, ownerUid, workId);
    if (!published.ok) return { ok: false, error: published.error };

    const recorded = await db.runTransaction(async (tx) => {
      const dedupSnap = await tx.get(dRef);
      if (dedupSnap.exists) return false;

      const summarySnap = await tx.get(summaryDocRef);
      const promoSnap = await tx.get(published.promoRef);
      tx.set(dRef, { target, workId, viewerKey, day, createdAt: FieldValue.serverTimestamp() });
      bumpCounter(tx, promoSnap, "viewCount", 1);
      bumpDayField(tx, summarySnap, "viewsByDay", "totalViews", day, 1);
      return true;
    });

    return { ok: true, recorded };
  }

  const published = await assertPublishedFull(db, ownerUid, workId);
  if (!published.ok) return { ok: false, error: published.error };

  const recorded = await db.runTransaction(async (tx) => {
    const dedupSnap = await tx.get(dRef);
    if (dedupSnap.exists) return false;

    const summarySnap = await tx.get(summaryDocRef);
    const workSnap = await tx.get(published.workRef);
    tx.set(dRef, { target, workId, viewerKey, day, createdAt: FieldValue.serverTimestamp() });
    bumpCounter(tx, workSnap, "viewCount", 1);
    bumpDayField(tx, summarySnap, "viewsByDay", "totalViews", day, 1);
    return true;
  });

  return { ok: true, recorded };
}

function emptySummary(): AnalyticsSummary {
  return { totalLikes: 0, totalViews: 0, likesByDay: {}, viewsByDay: {} };
}

export function parseAnalyticsSummary(data: Record<string, unknown> | undefined): AnalyticsSummary {
  if (!data) return emptySummary();
  return {
    totalLikes: typeof data.totalLikes === "number" ? data.totalLikes : 0,
    totalViews: typeof data.totalViews === "number" ? data.totalViews : 0,
    likesByDay: (data.likesByDay as Record<string, number>) ?? {},
    viewsByDay: (data.viewsByDay as Record<string, number>) ?? {},
  };
}

export async function getUploaderAnalytics(
  db: Firestore,
  ownerUid: string,
  days: number
): Promise<UploaderAnalyticsPayload> {
  const summarySnap = await analyticsRef(db, ownerUid).get();
  const summary = parseAnalyticsSummary(summarySnap.data() as Record<string, unknown> | undefined);

  const worksSnap = await worksCol(db, ownerUid).orderBy("sortOrder", "asc").get();
  const breakdown: WorkAnalyticsBreakdown[] = [];

  for (const doc of worksSnap.docs) {
    const work = parseWorkDoc(doc.id, doc.data() as Record<string, unknown>);
    const promoSnap = await promoRef(db, ownerUid, doc.id).get();
    let promoViews = 0;
    let promoLikes = 0;
    if (promoSnap.exists) {
      const promo = parsePromoDoc(promoSnap.data() as Record<string, unknown>);
      promoViews = promo.viewCount ?? 0;
      promoLikes = promo.likeCount ?? 0;
    }

    breakdown.push({
      workId: doc.id,
      title: work.title,
      fullViews: work.viewCount ?? 0,
      promoViews,
      promoLikes,
    });
  }

  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - days);
  const cutoffKey = dayKeyUTC(cutoff);

  const trimByDay = (byDay: Record<string, number>) => {
    const out: Record<string, number> = {};
    for (const [k, v] of Object.entries(byDay)) {
      if (k >= cutoffKey) out[k] = v;
    }
    return out;
  };

  return {
    summary: {
      ...summary,
      likesByDay: trimByDay(summary.likesByDay),
      viewsByDay: trimByDay(summary.viewsByDay),
    },
    breakdown,
  };
}

export function viewerKeyFromRequest(uid: string | null, sessionId: string | undefined): string | null {
  if (uid) return uid;
  if (sessionId && sessionId.length >= 8 && sessionId.length <= 128) return `anon_${sessionId}`;
  return null;
}
