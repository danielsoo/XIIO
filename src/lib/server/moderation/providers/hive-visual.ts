import { MODERATION_CONFIDENCE } from "@/lib/server/moderation/config";
import type { ModerationFlag } from "@/types/moderation";
import type { VideoModerationInput, VideoModerationResult } from "@/lib/server/moderation/providers/types";

const HIVE_API = "https://api.thehive.ai/api/v2/task/sync";

function severityFromScore(score: number, high: number, medium: number): ModerationFlag["severity"] | null {
  if (score >= high) return "high";
  if (score >= medium) return "medium";
  if (score >= medium * 0.85) return "low";
  return null;
}

export async function moderateVideoWithHive(input: VideoModerationInput): Promise<VideoModerationResult> {
  const apiKey = process.env.HIVE_API_KEY?.trim();
  if (!apiKey) {
    return { flags: [], provider: "hive", skipped: true, skipReason: "hive_not_configured" };
  }
  if (!input.videoUrl) {
    return { flags: [], provider: "hive", skipped: true, skipReason: "no_video_url" };
  }

  const form = new FormData();
  form.append("url", input.videoUrl);

  const res = await fetch(HIVE_API, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });

  const json = (await res.json()) as {
    status?: { response?: { output?: { classes?: { class?: string; score?: number }[] }[] }[] };
    message?: string;
  };

  if (!res.ok) {
    throw new Error(json.message ?? `Hive ${res.status}`);
  }

  const classes = json.status?.response?.[0]?.output?.[0]?.classes ?? [];
  let adultScore = 0;
  let violenceScore = 0;
  for (const c of classes) {
    const name = (c.class ?? "").toLowerCase();
    const score = Number(c.score) || 0;
    if (name.includes("sexual") || name.includes("nudity") || name.includes("yes_female_nudity")) {
      adultScore = Math.max(adultScore, score);
    }
    if (name.includes("violence") || name.includes("gore") || name.includes("weapon")) {
      violenceScore = Math.max(violenceScore, score);
    }
  }

  const flags: ModerationFlag[] = [];
  const adultSev = severityFromScore(adultScore, MODERATION_CONFIDENCE.adultHigh, MODERATION_CONFIDENCE.adultMedium);
  if (adultSev) {
    flags.push({ code: "adult", severity: adultSev, confidence: adultScore, detail: "Hive visual moderation" });
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
      detail: "Hive visual moderation",
    });
  }

  return { flags, provider: "hive" };
}
