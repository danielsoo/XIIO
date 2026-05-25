import { getGoogleCloudAccessToken } from "@/lib/server/moderation/google-auth";
import { MODERATION_CONFIDENCE } from "@/lib/server/moderation/config";
import type { ModerationFlag } from "@/types/moderation";
import type { VideoModerationInput, VideoModerationResult } from "@/lib/server/moderation/providers/types";

const ANNOTATE_URL = "https://videointelligence.googleapis.com/v1/videos:annotate";

type Likelihood =
  | "LIKELIHOOD_UNSPECIFIED"
  | "VERY_UNLIKELY"
  | "UNLIKELY"
  | "POSSIBLE"
  | "LIKELY"
  | "VERY_LIKELY";

function likelihoodToConfidence(l: Likelihood | string | undefined): number {
  switch (l) {
    case "VERY_LIKELY":
      return 0.95;
    case "LIKELY":
      return 0.8;
    case "POSSIBLE":
      return 0.55;
    case "UNLIKELY":
      return 0.25;
    case "VERY_UNLIKELY":
      return 0.05;
    default:
      return 0;
  }
}

function severityFromConfidence(confidence: number, high: number, medium: number): ModerationFlag["severity"] | null {
  if (confidence >= high) return "high";
  if (confidence >= medium) return "medium";
  if (confidence >= medium * 0.85) return "low";
  return null;
}

function flagsFromExplicitAnnotation(
  frames: { pornographyLikelihood?: string; violenceLikelihood?: string }[]
): ModerationFlag[] {
  let maxAdult = 0;
  let maxViolence = 0;
  for (const frame of frames) {
    maxAdult = Math.max(maxAdult, likelihoodToConfidence(frame.pornographyLikelihood as Likelihood));
    maxViolence = Math.max(maxViolence, likelihoodToConfidence(frame.violenceLikelihood as Likelihood));
  }

  const flags: ModerationFlag[] = [];
  const adultSev = severityFromConfidence(
    maxAdult,
    MODERATION_CONFIDENCE.adultHigh,
    MODERATION_CONFIDENCE.adultMedium
  );
  if (adultSev) {
    flags.push({
      code: "adult",
      severity: adultSev,
      confidence: maxAdult,
      detail: "Google Video Intelligence explicit",
    });
  }
  const violenceSev = severityFromConfidence(
    maxViolence,
    MODERATION_CONFIDENCE.violenceHigh,
    MODERATION_CONFIDENCE.violenceMedium
  );
  if (violenceSev) {
    flags.push({
      code: "violence",
      severity: violenceSev,
      confidence: maxViolence,
      detail: "Google Video Intelligence explicit",
    });
  }
  return flags;
}

async function pollOperation(operationName: string, token: string, maxMs = 120_000): Promise<unknown> {
  const pollUrl = operationName.startsWith("http")
    ? operationName
    : `https://videointelligence.googleapis.com/v1/${operationName}`;
  const started = Date.now();
  while (Date.now() - started < maxMs) {
    const res = await fetch(pollUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = (await res.json()) as {
      done?: boolean;
      error?: { message?: string };
      response?: unknown;
    };
    if (!res.ok) {
      throw new Error(json.error?.message ?? `operation poll ${res.status}`);
    }
    if (json.done) {
      if (json.error) throw new Error(json.error.message ?? "operation failed");
      return json.response;
    }
    await new Promise((r) => setTimeout(r, 3000));
  }
  throw new Error("Google Video Intelligence operation timed out");
}

export async function moderateVideoWithGoogle(input: VideoModerationInput): Promise<VideoModerationResult> {
  if (!input.videoUrl) {
    return {
      flags: [],
      provider: "google",
      skipped: true,
      skipReason: "no_mp4_url",
    };
  }

  const token = await getGoogleCloudAccessToken();
  if (!token) {
    return {
      flags: [],
      provider: "google",
      skipped: true,
      skipReason: "google_auth_unavailable",
    };
  }

  const annotateRes = await fetch(ANNOTATE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      inputUri: input.videoUrl,
      features: ["EXPLICIT_CONTENT_DETECTION"],
    }),
  });

  const annotateJson = (await annotateRes.json()) as {
    name?: string;
    error?: { message?: string };
  };

  if (!annotateRes.ok || !annotateJson.name) {
    throw new Error(annotateJson.error?.message ?? `annotate ${annotateRes.status}`);
  }

  const operationName = annotateJson.name;
  const response = (await pollOperation(operationName, token)) as {
    annotationResults?: {
      explicitAnnotation?: {
        frames?: { pornographyLikelihood?: string; violenceLikelihood?: string }[];
      };
    }[];
  };

  const frames =
    response.annotationResults?.[0]?.explicitAnnotation?.frames ?? [];
  return {
    flags: flagsFromExplicitAnnotation(frames),
    provider: "google",
  };
}
