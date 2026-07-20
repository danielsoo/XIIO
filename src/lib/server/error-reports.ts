import {
  ERROR_REPORT_STATUSES,
  type ErrorReportDoc,
  type ErrorReportStatus,
} from "@/types/error-report";

export function isErrorReportStatus(value: string): value is ErrorReportStatus {
  return (ERROR_REPORT_STATUSES as readonly string[]).includes(value);
}

export function parseErrorReportDoc(data: Record<string, unknown>): ErrorReportDoc {
  const status = String(data.status ?? "");
  return {
    reporterUid: String(data.reporterUid ?? ""),
    reporterEmail: data.reporterEmail != null ? String(data.reporterEmail) : null,
    errorMessage: String(data.errorMessage ?? ""),
    userDescription: String(data.userDescription ?? ""),
    errorCode: data.errorCode ? String(data.errorCode) : undefined,
    service: data.service ? String(data.service) : undefined,
    occurredAt: data.occurredAt ? String(data.occurredAt) : undefined,
    pagePath: String(data.pagePath ?? ""),
    stepId: data.stepId ? String(data.stepId) : undefined,
    uploadPhase: data.uploadPhase ? String(data.uploadPhase) : undefined,
    locale: data.locale ? String(data.locale) : undefined,
    userAgent: data.userAgent ? String(data.userAgent) : undefined,
    status: isErrorReportStatus(status) ? status : "pending",
    createdAt: data.createdAt,
    resolvedAt: data.resolvedAt,
    resolvedByUid: data.resolvedByUid ? String(data.resolvedByUid) : undefined,
    adminNote: data.adminNote ? String(data.adminNote) : undefined,
  };
}
