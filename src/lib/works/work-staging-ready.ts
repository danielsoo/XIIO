import type { PromoShortDoc, StreamStatus, WorkDoc } from "@/types/work";

export function isStreamEncoding(status: StreamStatus | undefined): boolean {
  return status === "uploading" || status === "processing";
}

/** 제출 전 확인 편집 가능 — 본편이 스테이징 또는 인코딩 완료 */
export function isWorkEditableForPromo(work: Pick<WorkDoc, "platformStatus" | "streamStatus">): boolean {
  if (work.platformStatus === "draft") {
    return work.streamStatus === "staged" || work.streamStatus === "ready";
  }
  return work.streamStatus === "ready";
}

export function hasCompleteVideoStaging(
  staging: WorkDoc["videoStaging"] | undefined
): staging is NonNullable<WorkDoc["videoStaging"]> {
  return Boolean(staging?.fullPath?.trim() && staging?.promoPath?.trim());
}

export function isPromoReadyForSubmit(promo: Pick<PromoShortDoc, "streamStatus">): boolean {
  return promo.streamStatus === "ready";
}

export function isWorkReadyForSubmit(work: Pick<WorkDoc, "streamStatus">): boolean {
  return work.streamStatus === "ready";
}
