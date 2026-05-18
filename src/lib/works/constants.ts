import type { RejectReasonCode, WorkSection } from "@/types/work";
import { WORK_SECTIONS } from "@/types/work";

export function isWorkSection(value: string): value is WorkSection {
  return (WORK_SECTIONS as readonly string[]).includes(value);
}

/** @deprecated use isWorkSection */
export const isWorkCategory = isWorkSection;

export function isRejectReasonCode(value: string): value is RejectReasonCode {
  return value === "category_mismatch" || value === "tag_mismatch" || value === "other";
}

export function mapWebhookStreamStatus(state?: string): "uploading" | "processing" | "ready" | "error" {
  if (state === "ready") return "ready";
  if (state === "error") return "error";
  if (state === "pendingupload") return "uploading";
  return "processing";
}
