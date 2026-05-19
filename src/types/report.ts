export const REPORT_TARGET_TYPES = ["full", "promo"] as const;
export type ReportTargetType = (typeof REPORT_TARGET_TYPES)[number];

export const REPORT_REASON_CODES = [
  "spam",
  "harassment",
  "copyright",
  "inappropriate",
  "other",
] as const;
export type ReportReasonCode = (typeof REPORT_REASON_CODES)[number];

export const REPORT_STATUSES = ["pending", "dismissed", "action_taken"] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

export type ReportDoc = {
  targetType: ReportTargetType;
  targetOwnerUid: string;
  targetWorkId: string;
  reporterUid: string;
  reporterEmail: string | null;
  reasonCode: ReportReasonCode;
  reasonDetail?: string;
  status: ReportStatus;
  createdAt?: unknown;
  resolvedAt?: unknown;
  resolvedByUid?: string;
  adminNote?: string;
};
