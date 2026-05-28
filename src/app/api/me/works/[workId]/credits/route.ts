import { NextResponse } from "next/server";
import { jsonError, requireUser } from "@/lib/server/api-auth";
import {
  creditDisplayNameMapKey,
  resolveWorkCreditDisplayName,
} from "@/lib/credit-display-name";
import {
  appendAcceptedWorkCredit,
  isWorkCreditRole,
  listWorkCredits,
  normalizeWorkCreditInput,
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
  const enriched = await Promise.all(
    credits.map(async (c) => {
      const u = await db.collection("users").doc(c.userId).get();
      const handle = u.exists
        ? parseUserProfileDoc(u.data() as Record<string, unknown>).handle
        : undefined;
      return {
        ...c,
        handle: handle ?? null,
      };
    })
  );
  return NextResponse.json({ credits: enriched });
}

export async function POST(request: Request, { params }: Params) {
  const auth = await requireUser(request);
  if ("error" in auth) return auth.error;

  const { workId } = await params;
  const db = await getDbOrNull();
  if (!db) return jsonError("admin_not_configured", "서버 DB를 사용할 수 없습니다.", 503);

  const ownerUid = auth.session.uid;
  const workSnap = await worksCol(db, ownerUid).doc(workId).get();
  if (!workSnap.exists) return jsonError("not_found", "작품을 찾을 수 없습니다.", 404);

  let body: { userId?: string; role?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return jsonError("invalid_json", "요청 형식(JSON)이 올바르지 않습니다.", 400);
  }

  const userId = String(body.userId ?? "").trim();
  const roleRaw = String(body.role ?? "").trim();
  if (!userId) return jsonError("credit_user_required", "회원 정보가 필요합니다.", 400);
  if (!isWorkCreditRole(roleRaw)) {
    return jsonError("credit_role_invalid", "유효하지 않은 역할입니다.", 400);
  }

  const input = normalizeWorkCreditInput({
    userId,
    role: roleRaw,
  });

  const validated = validateCreditInputs([input], ownerUid);
  if (!validated.ok) {
    return jsonError(validated.message, "크레딧 정보가 올바르지 않습니다.", 400);
  }

  const work = parseWorkDoc(workId, workSnap.data() as Record<string, unknown>);
  const userSnap = await db.collection("users").doc(userId).get();
  if (!userSnap.exists) {
    return jsonError("user_not_found", "회원을 찾을 수 없습니다.", 404);
  }
  const profile = parseUserProfileDoc(userSnap.data() as Record<string, unknown>);
  const displayName =
    resolveWorkCreditDisplayName(
      {
        displayName: profile.displayName,
        defaultDirectorName: profile.defaultDirectorName,
        handle: profile.handle,
      },
      roleRaw
    ) || profile.handle || "";

  try {
    const { credit, created } = await appendAcceptedWorkCredit(
      db,
      ownerUid,
      workId,
      validated.credits[0],
      displayName
    );
    return NextResponse.json({
      credit: { ...credit, handle: profile.handle ?? null },
      created,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "credit_append_failed";
    if (msg === "work_not_found") {
      return jsonError("not_found", "작품을 찾을 수 없습니다.", 404);
    }
    return jsonError("credit_append_failed", "크레딧을 추가하지 못했습니다.", 500);
  }
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

  for (const c of validated.credits) {
    const key = creditDisplayNameMapKey(c.userId, c.role);
    if (displayNames.has(key)) continue;
    const u = await db.collection("users").doc(c.userId).get();
    if (!u.exists) continue;
    const p = parseUserProfileDoc(u.data() as Record<string, unknown>);
    const resolved = resolveWorkCreditDisplayName(
      {
        displayName: p.displayName,
        defaultDirectorName: p.defaultDirectorName,
        handle: p.handle,
      },
      c.role
    );
    displayNames.set(key, resolved);
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
