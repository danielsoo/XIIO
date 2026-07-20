export const ERROR_REPORT_STATUSES = ["pending", "resolved"] as const;
export type ErrorReportStatus = (typeof ERROR_REPORT_STATUSES)[number];

export type ErrorReportDoc = {
  reporterUid: string;
  reporterEmail: string | null;
  errorMessage: string;
  userDescription: string;
  errorCode?: string;
  service?: string;
  occurredAt?: string;
  pagePath: string;
  stepId?: string;
  uploadPhase?: string;
  locale?: string;
  userAgent?: string;
  status: ErrorReportStatus;
  createdAt?: unknown;
  resolvedAt?: unknown;
  resolvedByUid?: string;
  adminNote?: string;
};

export type AdminErrorReportListItem = ErrorReportDoc & {
  id: string;
  reporterName: string;
};

export type AdminErrorReportsListResponse = {
  items: AdminErrorReportListItem[];
  nextCursor: string | null;
};
