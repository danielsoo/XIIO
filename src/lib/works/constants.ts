import type { WorkCategory } from "@/types/work";
import { WORK_CATEGORIES } from "@/types/work";

export function isWorkCategory(value: string): value is WorkCategory {
  return (WORK_CATEGORIES as readonly string[]).includes(value);
}

export function mapWebhookStreamStatus(state?: string): "uploading" | "processing" | "ready" | "error" {
  if (state === "ready") return "ready";
  if (state === "error") return "error";
  if (state === "pendingupload") return "uploading";
  return "processing";
}
