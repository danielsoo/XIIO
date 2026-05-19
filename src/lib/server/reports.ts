import {
  REPORT_REASON_CODES,
  REPORT_STATUSES,
  REPORT_TARGET_TYPES,
  type ReportDoc,
  type ReportReasonCode,
  type ReportStatus,
  type ReportTargetType,
} from "@/types/report";

export function isReportTargetType(v: string): v is ReportTargetType {
  return (REPORT_TARGET_TYPES as readonly string[]).includes(v);
}

export function isReportReasonCode(v: string): v is ReportReasonCode {
  return (REPORT_REASON_CODES as readonly string[]).includes(v);
}

export function isReportStatus(v: string): v is ReportStatus {
  return (REPORT_STATUSES as readonly string[]).includes(v);
}

export function parseReportDoc(data: Record<string, unknown>): ReportDoc {
  const reasonCode = data.reasonCode;
  const status = data.status;
  const targetTypeRaw = String(data.targetType ?? "");
  return {
    targetType: isReportTargetType(targetTypeRaw) ? targetTypeRaw : "full",
    targetOwnerUid: String(data.targetOwnerUid ?? ""),
    targetWorkId: String(data.targetWorkId ?? ""),
    reporterUid: String(data.reporterUid ?? ""),
    reporterEmail: data.reporterEmail != null ? String(data.reporterEmail) : null,
    reasonCode: isReportReasonCode(String(reasonCode))
      ? (reasonCode as ReportReasonCode)
      : "other",
    reasonDetail: data.reasonDetail ? String(data.reasonDetail) : undefined,
    status: isReportStatus(String(status)) ? (status as ReportStatus) : "pending",
    createdAt: data.createdAt,
    resolvedAt: data.resolvedAt,
    resolvedByUid: data.resolvedByUid ? String(data.resolvedByUid) : undefined,
    adminNote: data.adminNote ? String(data.adminNote) : undefined,
  };
}
