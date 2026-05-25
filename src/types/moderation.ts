export const MODERATION_FLAG_CODES = [
  "adult",
  "violence",
  "copyright_audio",
  "copyright_video",
  "policy_illegal",
] as const;

export type ModerationFlagCode = (typeof MODERATION_FLAG_CODES)[number];

export const MODERATION_SEVERITIES = ["low", "medium", "high"] as const;

export type ModerationSeverity = (typeof MODERATION_SEVERITIES)[number];

export const MODERATION_STATUSES = ["pending", "completed", "failed", "skipped"] as const;

export type ModerationStatus = (typeof MODERATION_STATUSES)[number];

export type ModerationFlag = {
  code: ModerationFlagCode;
  severity: ModerationSeverity;
  confidence: number;
  detail?: string;
};

/** Firestore-serializable moderation snapshot (timestamps as unknown) */
export type ContentModeration = {
  status: ModerationStatus;
  flags: ModerationFlag[];
  summary?: string;
  providers: string[];
  analyzedAt?: unknown;
  streamUid?: string;
  error?: string;
  /** Denormalized for admin queries — any flag with severity high */
  hasHighSeverity?: boolean;
};

export type VideoModerationProviderId = "google" | "hive" | "sightengine";
