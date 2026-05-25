import { DEFAULT_VIDEO_MODERATION_PROVIDER } from "@/lib/server/moderation/vendor-strategy";
import type { VideoModerationProviderId } from "@/types/moderation";

export function isContentModerationEnabled(): boolean {
  const raw = process.env.CONTENT_MODERATION_ENABLED?.trim().toLowerCase();
  return raw === "true" || raw === "1";
}

export function getVideoModerationProvider(): VideoModerationProviderId {
  const raw = process.env.CONTENT_MODERATION_VIDEO_PROVIDER?.trim().toLowerCase();
  if (raw === "google" || raw === "hive" || raw === "sightengine") return raw;
  return DEFAULT_VIDEO_MODERATION_PROVIDER;
}

export function getGeminiApiKey(): string | null {
  return process.env.GEMINI_API_KEY?.trim() || null;
}

export const MODERATION_CONFIDENCE = {
  adultHigh: Number(process.env.MODERATION_ADULT_HIGH ?? "0.75"),
  adultMedium: Number(process.env.MODERATION_ADULT_MEDIUM ?? "0.5"),
  violenceHigh: Number(process.env.MODERATION_VIOLENCE_HIGH ?? "0.7"),
  violenceMedium: Number(process.env.MODERATION_VIOLENCE_MEDIUM ?? "0.45"),
  policyHigh: Number(process.env.MODERATION_POLICY_HIGH ?? "0.7"),
  policyMedium: Number(process.env.MODERATION_POLICY_MEDIUM ?? "0.45"),
} as const;
