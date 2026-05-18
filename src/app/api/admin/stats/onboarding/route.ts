import { NextResponse } from "next/server";
import { verifyBearerIdToken, getAdminDb } from "@/lib/server/firebase-admin";
import { hasAdminAccess } from "@/lib/server/admin-uids";
import { Timestamp } from "firebase-admin/firestore";

import type { OnboardingStatsPayload } from "@/types/admin";

function dayKeyUTC(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function GET(request: Request) {
  const session = await verifyBearerIdToken(request.headers.get("authorization"));
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!hasAdminAccess(session.uid, session.email)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const db = getAdminDb();
  if (!db) {
    return NextResponse.json(
      { error: "server_misconfigured", detail: "Firebase Admin not initialized" },
      { status: 503 }
    );
  }

  let watch = 0;
  let upload = 0;
  let other = 0;
  const signupsByDay: Record<string, number> = {};

  const snap = await db.collection("users").get();
  snap.forEach((doc) => {
    const data = doc.data();
    const purpose = data.platformPurpose;
    if (purpose === "watch") watch += 1;
    else if (purpose === "upload") upload += 1;
    else other += 1;

    const created = data.createdAt;
    let createdDate: Date | null = null;
    if (created instanceof Timestamp) {
      createdDate = created.toDate();
    } else if (created && typeof (created as { toDate?: () => Date }).toDate === "function") {
      createdDate = (created as { toDate: () => Date }).toDate();
    }
    if (createdDate) {
      const key = dayKeyUTC(createdDate);
      signupsByDay[key] = (signupsByDay[key] ?? 0) + 1;
    }
  });

  const payload: OnboardingStatsPayload = {
    total: snap.size,
    watch,
    upload,
    other,
    signupsByDay,
  };

  return NextResponse.json(payload);
}
