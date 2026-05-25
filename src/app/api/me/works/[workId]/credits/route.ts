import { NextResponse } from "next/server";
import { jsonError, requireUser } from "@/lib/server/api-auth";
import {
  listWorkCredits,
  validateCreditInputs,
  writeWorkCredits,
} from "@/lib/server/credits";
import { getDbOrNull, parseWorkDoc, worksCol } from "@/lib/server/works";
import { parseUserProfileDoc } from "@/lib/userAccess";
import type { WorkCreditInput } from "@/types/credits";

type Params = { params: Promise<{ workId: string }> };

export async function GET(request: Request, { params }: Params) {
  const auth = await requireUser(request);
  if ("error" in auth) return auth.error;

  const { workId } = await params;
  const db = await getDbOrNull();
  if (!db) return jsonError("admin_not_configured", "서버 DB를 사용할 수 없습니다.", 503);

  const workSnap = await worksCol(db, auth.session.uid).doc(workId).get();
  if (!workSnap.exists) return jsonError("not_found", "작품을 찾을 수 없습니다.", 404);

  const credits = await listWorkCredits(db, auth.session.uid, workId);
  return NextResponse.json({ credits });
}

export async function PUT(request: Request, { params }: Params) {
  const auth = await requireUser(request);
  if ("error" in auth) return auth.error;

  const { workId } = await params;
  const db = await getDbOrNull();
  if (!db) return jsonError("admin_not_configured", "서버 DB를 사용할 수 없습니다.", 503);

  const ownerUid = auth.session.uid;
  const workSnap = await worksCol(db, ownerUid).doc(workId).get();
  if (!workSnap.exists) return jsonError("not_found", "작품을 찾을 수 없습니다.", 404);

  let body: { credits?: WorkCreditInput[] };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return jsonError("invalid_json", "요청 형식(JSON)이 올바르지 않습니다.", 400);
  }

  const inputs = Array.isArray(body.credits) ? body.credits : [];
  const validated = validateCreditInputs(inputs, ownerUid);
  if (!validated.ok) {
    return jsonError(validated.message, "크레딧 정보가 올바르지 않습니다.", 400);
  }

  const work = parseWorkDoc(workId, workSnap.data() as Record<string, unknown>);
  const displayNames = new Map<string, string>();

  const ownerSnap = await db.collection("users").doc(ownerUid).get();
  if (ownerSnap.exists) {
    const p = parseUserProfileDoc(ownerSnap.data() as Record<string, unknown>);
    displayNames.set(ownerUid, p.displayName || p.defaultDirectorName || "");
  }

  for (const c of validated.credits) {
    if (displayNames.has(c.userId)) continue;
    const u = await db.collection("users").doc(c.userId).get();
    if (u.exists) {
      const p = parseUserProfileDoc(u.data() as Record<string, unknown>);
      displayNames.set(c.userId, p.displayName);
    }
  }

  const credits = await writeWorkCredits(
    db,
    ownerUid,
    workId,
    work,
    validated.credits,
    displayNames
  );

  return NextResponse.json({ credits });
}
