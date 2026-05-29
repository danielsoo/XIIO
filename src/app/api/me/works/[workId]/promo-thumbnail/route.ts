import { NextResponse } from "next/server";
import { jsonError, requireUser } from "@/lib/server/api-auth";
import {
  FieldValue,
  getDbOrNull,
  parseWorkDoc,
  promoRef,
  worksCol,
} from "@/lib/server/works";
import { normalizePromoFrameCrop } from "@/lib/works/promo-crop";
import type { PromoFrameCrop } from "@/types/work";

type Params = { params: Promise<{ workId: string }> };

function parseThumbnailCropBody(value: unknown): PromoFrameCrop | undefined {
  if (value === undefined || value === null) return undefined;
  return normalizePromoFrameCrop(value);
}

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireUser(request);
  if ("error" in auth) return auth.error;
  const { session } = auth;
  const { workId } = await params;

  let body: { thumbnailUrl?: string; thumbnailCrop?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return jsonError("invalid_json", "요청 형식이 올바르지 않습니다.", 400);
  }

  const thumbnailUrlRaw = body.thumbnailUrl?.trim();
  const thumbnailUrl =
    thumbnailUrlRaw && thumbnailUrlRaw.startsWith("https://") ? thumbnailUrlRaw : undefined;
  const thumbnailCrop = parseThumbnailCropBody(body.thumbnailCrop);

  if (!thumbnailUrl && thumbnailCrop === undefined) {
    return jsonError("invalid_body", "썸네일 URL 또는 크롭 정보가 필요합니다.", 400);
  }
  if (thumbnailUrlRaw && !thumbnailUrl) {
    return jsonError("invalid_thumbnail", "유효한 썸네일 URL이 필요합니다.", 400);
  }

  const db = await getDbOrNull();
  if (!db) return jsonError("admin_not_configured", "서버 DB를 사용할 수 없습니다.", 503);

  const workRef = worksCol(db, session.uid).doc(workId);
  const workSnap = await workRef.get();
  if (!workSnap.exists) {
    return jsonError("not_found", "작품을 찾을 수 없습니다.", 404);
  }

  const work = parseWorkDoc(workId, workSnap.data() as Record<string, unknown>);
  const promoDocRef = promoRef(db, session.uid, workId);
  const promoSnap = await promoDocRef.get();
  const existingThumb =
    (promoSnap.exists
      ? (promoSnap.data() as Record<string, unknown>).thumbnailUrl
      : undefined) ??
    work.promoDraft?.thumbnailUrl ??
    null;

  if (!thumbnailUrl && thumbnailCrop !== undefined && !existingThumb) {
    return jsonError("no_thumbnail", "저장된 썸네일이 없어 크롭만 저장할 수 없습니다.", 400);
  }

  if (work.promoDraft) {
    const nextDraft = {
      ...work.promoDraft,
      ...(thumbnailUrl ? { thumbnailUrl } : {}),
      ...(thumbnailCrop !== undefined ? { thumbnailCrop } : {}),
    };
    await workRef.update({
      promoDraft: nextDraft,
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  if (promoSnap.exists || thumbnailUrl) {
    await promoDocRef.set(
      {
        ...(thumbnailUrl ? { thumbnailUrl } : {}),
        ...(thumbnailCrop !== undefined ? { thumbnailCrop } : {}),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  }

  return NextResponse.json({
    ok: true,
    ...(thumbnailUrl ? { thumbnailUrl } : {}),
    ...(thumbnailCrop !== undefined ? { thumbnailCrop } : {}),
  });
}
