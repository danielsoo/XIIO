import { FieldValue, type Firestore } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/server/firebase-admin";

const ACTIVITY_DOC_ID = "activity";

export function userActivityRef(db: Firestore, uid: string) {
  return db.collection("users").doc(uid).collection("private").doc(ACTIVITY_DOC_ID);
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
}> {
  const db = getAdminDb();
  if (!db) return { visitCount: 0, lastVisitAt: null };

  const snap = await userActivityRef(db, uid).get();
  if (!snap.exists) return { visitCount: 0, lastVisitAt: null };
  const data = snap.data() ?? {};
  return {
    visitCount: typeof data.visitCount === "number" ? data.visitCount : 0,
    lastVisitAt: data.lastVisitAt ?? null,
  };
}
