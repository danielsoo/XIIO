export const ADMIN_AUDIT_ACTIONS = [
  "work_approve",
  "work_reject",
  "work_revision_approve",
  "work_revision_reject",
  "work_removal_approve",
  "work_removal_reject",
  "promo_approve",
  "promo_reject",
  "promo_revision_approve",
  "promo_revision_reject",
  "promo_removal_approve",
  "promo_removal_reject",
  "report_dismiss",
  "report_uphold",
] as const;

export type AdminAuditAction = (typeof ADMIN_AUDIT_ACTIONS)[number];

export type AdminAuditTargetType = "full" | "promo" | "report";

export type AdminAuditDoc = {
  actorUid: string;
  action: AdminAuditAction;
  targetOwnerUid: string;
  targetWorkId?: string;
  targetType?: AdminAuditTargetType;
  targetReportId?: string;
  workTitle?: string;
  note?: string;
  createdAt?: unknown;
};
