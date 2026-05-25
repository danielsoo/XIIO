import {
  MODERATION_FLAG_CODES,
  MODERATION_SEVERITIES,
  MODERATION_STATUSES,
  type ContentModeration,
  type ModerationFlag,
  type ModerationFlagCode,
  type ModerationSeverity,
  type ModerationStatus,
} from "@/types/moderation";

function isFlagCode(v: string): v is ModerationFlagCode {
  return (MODERATION_FLAG_CODES as readonly string[]).includes(v);
}

function isSeverity(v: string): v is ModerationSeverity {
  return (MODERATION_SEVERITIES as readonly string[]).includes(v);
}

function isStatus(v: string): v is ModerationStatus {
  return (MODERATION_STATUSES as readonly string[]).includes(v);
}

function parseFlag(raw: unknown): ModerationFlag | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const code = typeof o.code === "string" ? o.code : "";
  const severity = typeof o.severity === "string" ? o.severity : "";
  const confidence = Number(o.confidence);
  if (!isFlagCode(code) || !isSeverity(severity) || !Number.isFinite(confidence)) return null;
  return {
    code,
    severity,
    confidence: Math.min(1, Math.max(0, confidence)),
    detail: typeof o.detail === "string" ? o.detail : undefined,
  };
}

export function parseContentModeration(data: Record<string, unknown>): ContentModeration | undefined {
  const raw = data.contentModeration;
  if (!raw || typeof raw !== "object") return undefined;
  const o = raw as Record<string, unknown>;
  const statusRaw = typeof o.status === "string" ? o.status : "pending";
  const status: ModerationStatus = isStatus(statusRaw) ? statusRaw : "pending";
  const flags: ModerationFlag[] = [];
  if (Array.isArray(o.flags)) {
    for (const item of o.flags) {
      const f = parseFlag(item);
      if (f) flags.push(f);
    }
  }
  const providers = Array.isArray(o.providers)
    ? o.providers.map((p) => String(p)).filter(Boolean)
    : [];
  const hasHighFromFlags = flags.some((f) => f.severity === "high");
  const hasHighSeverity =
    typeof o.hasHighSeverity === "boolean" ? o.hasHighSeverity : hasHighFromFlags;

  return {
    status,
    flags,
    summary: typeof o.summary === "string" ? o.summary : undefined,
    providers,
    analyzedAt: o.analyzedAt,
    streamUid: typeof o.streamUid === "string" ? o.streamUid : undefined,
    error: typeof o.error === "string" ? o.error : undefined,
    hasHighSeverity,
  };
}

export function moderationHasHighSeverity(flags: ModerationFlag[]): boolean {
  return flags.some((f) => f.severity === "high");
}
