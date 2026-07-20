import { NextResponse } from "next/server";
import { jsonError, requireUser } from "@/lib/server/api-auth";
import { requireCompleteMemberProfile } from "@/lib/server/member-access";
import { FieldValue, getDbOrNull, parseWorkDoc, worksCol } from "@/lib/server/works";
import type { WorkVideoStaging } from "@/types/work";
import {
  CURRENT_PLAYBACK_MAX_HEIGHT,
  classifySourceVideoQuality,
  supportsFutureHighResolutionDelivery,
} from "@/lib/works/source-video-quality";

type Params = { params: Promise<{ workId: string }> };

function isValidStagingPath(
  uid: string,
  workId: string,
  path: string,
  kind: "full" | "promo" | "prologue"
): boolean {
  const prefix = `users/${uid}/works/${workId}/staging/${kind}.`;
  return path.startsWith(prefix) && !path.includes("..");
}

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireUser(request);
  if ("error" in auth) return auth.error;
  const { session } = auth;
  const { workId } = await params;

  let body: {
    full?: {
      path?: string;
      bytes?: number;
      contentType?: string;
      originalFileName?: string;
      width?: number;
      height?: number;
      durationSec?: number;
    };
    promo?: {
      path?: string;
      bytes?: number;
      contentType?: string;
      trimStartSec?: number;
      trimEndSec?: number;
    };
    prologue?: { path?: string; bytes?: number; contentType?: string };
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return jsonError("invalid_json", "요청 형식이 올바르지 않습니다.", 400);
  }

  const db = await getDbOrNull();
  if (!db) return jsonError("admin_not_configured", "서버 DB를 사용할 수 없습니다.", 503);

  const profileBlock = await requireCompleteMemberProfile(db, session.uid);
  if (profileBlock) return profileBlock;

  const workRef = worksCol(db, session.uid).doc(workId);
  const workSnap = await workRef.get();
  if (!workSnap.exists) return jsonError("not_found", "작품을 찾을 수 없습니다.", 404);

  const work = parseWorkDoc(workId, workSnap.data() as Record<string, unknown>);
  if (work.platformStatus !== "draft") {
    return jsonError("invalid_state", "제출 전 초안만 스테이징을 수정할 수 있습니다.", 400);
  }

  const existing = work.videoStaging ?? { fullPath: "", promoPath: "" };
  const next: WorkVideoStaging = { ...existing };

  if (body.full?.path) {
    const path = body.full.path.trim();
    if (!isValidStagingPath(session.uid, workId, path, "full")) {
      return jsonError("invalid_path", "본편 스테이징 경로가 올바르지 않습니다.", 400);
    }
    next.fullPath = path;
    if (typeof body.full.bytes === "number") next.fullBytes = body.full.bytes;
    if (body.full.contentType) next.fullContentType = body.full.contentType;
  }

  if (body.promo?.path) {
    const path = body.promo.path.trim();
    if (!isValidStagingPath(session.uid, workId, path, "promo")) {
      return jsonError("invalid_path", "쇼츠 스테이징 경로가 올바르지 않습니다.", 400);
    }
    next.promoPath = path;
    if (typeof body.promo.bytes === "number") next.promoBytes = body.promo.bytes;
    if (body.promo.contentType) next.promoContentType = body.promo.contentType;
    const hasTrimStart = typeof body.promo.trimStartSec === "number";
    const hasTrimEnd = typeof body.promo.trimEndSec === "number";
    if (hasTrimStart !== hasTrimEnd) {
      return jsonError("invalid_promo_trim", "쇼츠 자르기 시작과 끝 시간을 모두 지정해 주세요.", 400);
    }
    if (hasTrimStart && hasTrimEnd) {
      const start = body.promo.trimStartSec as number;
      const end = body.promo.trimEndSec as number;
      if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end <= start) {
        return jsonError("invalid_promo_trim", "쇼츠 자르기 구간이 올바르지 않습니다.", 400);
      }
      next.promoTrimStartSec = start;
      next.promoTrimEndSec = end;
    } else {
      delete next.promoTrimStartSec;
      delete next.promoTrimEndSec;
    }
  }

  if (body.prologue?.path) {
    const path = body.prologue.path.trim();
    if (!isValidStagingPath(session.uid, workId, path, "prologue")) {
      return jsonError("invalid_path", "프롤로그 스테이징 경로가 올바르지 않습니다.", 400);
    }
    next.prologuePath = path;
    if (typeof body.prologue.bytes === "number") next.prologueBytes = body.prologue.bytes;
    if (body.prologue.contentType) next.prologueContentType = body.prologue.contentType;
  }

  if (!next.fullPath) next.fullPath = existing.fullPath;
  if (!next.promoPath) next.promoPath = existing.promoPath;

  next.updatedAt = FieldValue.serverTimestamp();

  const update: Record<string, unknown> = {
    videoStaging: next,
    updatedAt: FieldValue.serverTimestamp(),
  };
  if (body.full?.path) {
    const width = positiveFiniteNumber(body.full.width);
    const height = positiveFiniteNumber(body.full.height);
    const durationSec = positiveFiniteNumber(body.full.durationSec);
    const sourceQuality =
      width && height ? classifySourceVideoQuality(width, height) : undefined;
    const originalFileName = safeOriginalFileName(body.full.originalFileName);

    update.videoMaster = {
      storagePath: body.full.path.trim(),
      ...(originalFileName ? { originalFileName } : {}),
      ...(typeof body.full.bytes === "number" && body.full.bytes > 0
        ? { bytes: body.full.bytes }
        : {}),
      ...(body.full.contentType ? { contentType: body.full.contentType } : {}),
      ...(width ? { width } : {}),
      ...(height ? { height } : {}),
      ...(durationSec ? { durationSec } : {}),
      ...(sourceQuality ? { sourceQuality } : {}),
      highResolutionEligible: sourceQuality
        ? supportsFutureHighResolutionDelivery(sourceQuality)
        : false,
      playbackMaxHeight: CURRENT_PLAYBACK_MAX_HEIGHT,
      preservationStatus: "preserved",
      storageProvider: "firebase",
      updatedAt: FieldValue.serverTimestamp(),
    };
  }
  if (next.fullPath && next.promoPath) {
    update.streamStatus = "staged";
  }

  await workRef.update(update);

  return NextResponse.json({ ok: true, videoStaging: next });
}

function positiveFiniteNumber(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return undefined;
  return value;
}

function safeOriginalFileName(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const name = value.split(/[\\/]/).pop()?.trim().slice(0, 255);
  return name || undefined;
}
