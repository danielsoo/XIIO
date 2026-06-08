import { FieldValue, type Firestore, type Timestamp } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/server/firebase-admin";

const ACTIVITY_DOC_ID = "activity";

export const ONLINE_THRESHOLD_MS = 5 * 60 * 1000;

export function userActivityRef(db: Firestore, uid: string) {
  return db.collection("users").doc(uid).collection("private").doc(ACTIVITY_DOC_ID);
}

function activityTimestampToMillis(value: unknown): number | null {
  if (value && typeof value === "object" && "toMillis" in value) {
    return (value as Timestamp).toMillis();
  }
  return null;
}

function activityTimestampToIso(value: unknown): string | null {
  const ms = activityTimestampToMillis(value);
  if (ms == null) return null;
  return new Date(ms).toISOString();
}

export type UserActivityStatus = {
  isOnline: boolean;
  lastSeenAt: string | null;
};

export function isUserOnline(lastSeenAt: unknown, now = Date.now()): boolean {
  const ms = activityTimestampToMillis(lastSeenAt);
  if (ms == null) return false;
  return now - ms < ONLINE_THRESHOLD_MS;
}

export async function touchUserPresence(uid: string): Promise<void> {
  const db = getAdminDb();
  if (!db) throw new Error("Firebase Admin not configured");

  await userActivityRef(db, uid).set(
    {
      lastSeenAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

export async function recordUserVisit(uid: string): Promise<{ visitCount: number }> {
  const db = getAdminDb();
  if (!db) throw new Error("Firebase Admin not configured");

  const ref = userActivityRef(db, uid);
  const result = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const prev = snap.data()?.visitCount;
    const visitCount = (typeof prev === "number" ? prev : 0) + 1;
    tx.set(
      ref,
      {
        visitCount,
        lastVisitAt: FieldValue.serverTimestamp(),
        lastSeenAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    return visitCount;
  });
  return { visitCount: result };
}

export async function getUserActivity(uid: string): Promise<{
  visitCount: number;
  lastVisitAt: unknown;
  lastSeenAt: unknown;
}> {
  const db = getAdminDb();
  if (!db) return { visitCount: 0, lastVisitAt: null, lastSeenAt: null };

  const snap = await userActivityRef(db, uid).get();
  if (!snap.exists) return { visitCount: 0, lastVisitAt: null, lastSeenAt: null };
  const data = snap.data() ?? {};
  return {
    visitCount: typeof data.visitCount === "number" ? data.visitCount : 0,
    lastVisitAt: data.lastVisitAt ?? null,
    lastSeenAt: data.lastSeenAt ?? data.lastVisitAt ?? null,
  };
}

export async function getUsersActivityStatus(
  uids: string[]
): Promise<Record<string, UserActivityStatus>> {
  if (uids.length === 0) return {};

  const now = Date.now();
  const entries = await Promise.all(
    uids.map(async (uid) => {
      const activity = await getUserActivity(uid);
      const lastSeenAt = activityTimestampToIso(activity.lastSeenAt);
      return [
        uid,
        {
          isOnline: isUserOnline(activity.lastSeenAt, now),
          lastSeenAt,
        },
      ] as const;
    })
  );
  return Object.fromEntries(entries);
}

export async function getUsersOnlineStatus(uids: string[]): Promise<Record<string, boolean>> {
  const statusByUid = await getUsersActivityStatus(uids);
  return Object.fromEntries(
    uids.map((uid) => [uid, statusByUid[uid]?.isOnline === true] as const)
  );
}
