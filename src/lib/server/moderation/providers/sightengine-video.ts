import { MODERATION_CONFIDENCE } from "@/lib/server/moderation/config";
import type { ModerationFlag } from "@/types/moderation";
import type { VideoModerationInput, VideoModerationResult } from "@/lib/server/moderation/providers/types";

const SIGHTENGINE_SYNC = "https://api.sightengine.com/1.0/video/check-sync.json";

function severityFromScore(score: number, high: number, medium: number): ModerationFlag["severity"] | null {
  if (score >= high) return "high";
  if (score >= medium) return "medium";
  if (score >= medium * 0.85) return "low";
  return null;
}

export async function moderateVideoWithSightengine(input: VideoModerationInput): Promise<VideoModerationResult> {
  const user = process.env.SIGHTENGINE_API_USER?.trim();
  const secret = process.env.SIGHTENGINE_API_SECRET?.trim();
  if (!user || !secret) {
    return { flags: [], provider: "sightengine", skipped: true, skipReason: "sightengine_not_configured" };
  }

  const mediaUrl = input.videoUrl;
  if (!mediaUrl) {
    return { flags: [], provider: "sightengine", skipped: true, skipReason: "no_video_url" };
  }

  const params = new URLSearchParams({
    api_user: user,
    api_secret: secret,
    stream_url: mediaUrl,
    models: "nudity-2.1,gore-2.0",
  });

  const res = await fetch(`${SIGHTENGINE_SYNC}?${params.toString()}`, { method: "GET" });
  const json = (await res.json()) as {
    status?: string;
    nudity?: { sexual_activity?: number; sexual_display?: number; erotica?: number };
    gore?: { prob?: number };
    violence?: { prob?: number };
    error?: { message?: string };
  };

  if (!res.ok || json.status === "failure") {
    throw new Error(json.error?.message ?? `Sightengine ${res.status}`);
  }

  const nudity = json.nudity ?? {};
  const adultScore = Math.max(
    Number(nudity.sexual_activity) || 0,
    Number(nudity.sexual_display) || 0,
    Number(nudity.erotica) || 0
  );
  const violenceScore = Math.max(Number(json.gore?.prob) || 0, Number(json.violence?.prob) || 0);

  const flags: ModerationFlag[] = [];
  const adultSev = severityFromScore(adultScore, MODERATION_CONFIDENCE.adultHigh, MODERATION_CONFIDENCE.adultMedium);
  if (adultSev) {
    flags.push({ code: "adult", severity: adultSev, confidence: adultScore, detail: "Sightengine video" });
  }
  const violenceSev = severityFromScore(
    violenceScore,
    MODERATION_CONFIDENCE.violenceHigh,
    MODERATION_CONFIDENCE.violenceMedium
  );
  if (violenceSev) {
    flags.push({
      code: "violence",
      severity: violenceSev,
      confidence: violenceScore,
      detail: "Sightengine video",
    });
  }

  return { flags, provider: "sightengine" };
}
