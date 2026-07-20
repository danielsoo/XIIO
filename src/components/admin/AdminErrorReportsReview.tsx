"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/context/LocaleContext";
import { formatApiError, formatClientError, readResponseJson } from "@/lib/clientErrors";
import type {
  AdminErrorReportListItem,
  AdminErrorReportsListResponse,
} from "@/types/error-report";

type Queue = "pending" | "resolved";

export default function AdminErrorReportsReview() {
  const { user } = useAuth();
  const { t, formatDateTime } = useTranslations();
  const [queue, setQueue] = useState<Queue>("pending");
  const [items, setItems] = useState<AdminErrorReportListItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [noteById, setNoteById] = useState<Record<string, string>>({});

  const load = useCallback(
    async ({ cursor, append = false }: { cursor?: string | null; append?: boolean } = {}) => {
      if (!user) return;
      append ? setLoadingMore(true) : setLoading(true);
      setError(null);
      try {
        const token = await user.getIdToken();
        const params = new URLSearchParams({ queue, limit: "25" });
        if (cursor) params.set("cursor", cursor);
        const res = await fetch(`/api/admin/error-reports?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const { data: body, raw } = await readResponseJson<
          AdminErrorReportsListResponse & { message?: string; error?: string }
        >(res);
        if (!res.ok) {
          setError(
            formatApiError(t, res.status, {
              ...body,
              message: body.message ?? raw.slice(0, 500),
            })
          );
          if (!append) setItems([]);
          return;
        }
        setItems((current) => (append ? [...current, ...body.items] : body.items));
        setNextCursor(body.nextCursor ?? null);
      } catch (loadError) {
        setError(
          formatClientError(t, loadError, {
            titleKey: "admin.errorReports.loadError",
          })
        );
        if (!append) setItems([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [queue, t, user]
  );

  useEffect(() => {
    void load();
  }, [load]);

  const resolve = async (reportId: string) => {
    if (!user) return;
    setBusyId(reportId);
    setError(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/admin/error-reports/${reportId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ adminNote: noteById[reportId]?.trim() || undefined }),
      });
      if (!res.ok) {
        const { data: body, raw } = await readResponseJson<{
          message?: string;
          error?: string;
        }>(res);
        setError(
          formatApiError(t, res.status, {
            ...body,
            message: body.message ?? raw.slice(0, 500),
          })
        );
        return;
      }
      setNoteById((current) => ({ ...current, [reportId]: "" }));
      await load();
    } catch (resolveError) {
      setError(
        formatClientError(t, resolveError, {
          titleKey: "admin.errorReports.actionFailed",
        })
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div className="mb-6 flex gap-2">
        {(["pending", "resolved"] as Queue[]).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setQueue(value)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              queue === value
                ? "bg-xiio-accent text-white"
                : "border border-white/10 bg-white/5 text-xiio-muted hover:text-white"
            }`}
          >
            {t(
              value === "pending"
                ? "admin.errorReports.tabPending"
                : "admin.errorReports.tabResolved"
            )}
          </button>
        ))}
      </div>

      {loading ? <p className="text-sm text-xiio-muted">{t("admin.loading")}</p> : null}
      {error ? (
        <p className="mb-4 whitespace-pre-wrap break-words text-sm text-red-400">{error}</p>
      ) : null}
      {!loading && items.length === 0 ? (
        <p className="text-sm text-xiio-muted">{t("admin.errorReports.empty")}</p>
      ) : null}

      <ul className="space-y-4">
        {items.map((item) => {
          const mailSubject = t("admin.errorReports.emailSubject", { id: item.id });
          const mailBody = t("admin.errorReports.emailBody", { id: item.id });
          const mailHref = item.reporterEmail
            ? `mailto:${item.reporterEmail}?subject=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(mailBody)}`
            : null;
          return (
            <li key={item.id} className="rounded-2xl border border-white/10 bg-xiio-surface p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-sky-300/80">
                    {t("admin.errorReports.technicalError")}
                    {queue === "resolved" ? (
                      <span className="ml-2 text-xiio-muted">
                        · {t("admin.errorReports.statusResolved")}
                      </span>
                    ) : null}
                  </p>
                  <h2 className="mt-1 whitespace-pre-wrap break-words text-base font-semibold text-white">
                    {item.errorMessage}
                  </h2>
                  <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-white/45">
                    <span className="rounded-full border border-red-300/20 bg-red-300/[0.05] px-2.5 py-1">
                      {item.errorCode ?? "UPLOAD_UNKNOWN"}
                    </span>
                    <span className="rounded-full border border-white/10 px-2.5 py-1">
                      {item.service ?? "Uploader"}
                    </span>
                  </div>
                </div>
                <p className="shrink-0 text-xs text-white/35">#{item.id}</p>
              </div>

              {item.userDescription ? <div className="mt-4 rounded-xl border border-white/[0.07] bg-black/20 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/35">
                  {t("admin.errorReports.userDescription")}
                </p>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-white/75">
                  {item.userDescription}
                </p>
              </div> : null}

              <div className="mt-4 grid gap-2 text-xs text-xiio-muted sm:grid-cols-2">
                <p>
                  {t("admin.errorReports.reporter")}: {" "}
                  <Link href={`/admin/users/${item.reporterUid}`} className="text-xiio-accent hover:underline">
                    {item.reporterName}
                  </Link>
                </p>
                <p>
                  {t("admin.errorReports.reportedAt")}: {formatDateTime(item.createdAt)}
                </p>
                <p className="break-all">
                  {t("admin.errorReports.page")}: {item.pagePath || "—"}
                </p>
                <p>
                  {t("admin.errorReports.step")}: {item.stepId || "—"}
                  {item.uploadPhase ? ` · ${item.uploadPhase}` : ""}
                </p>
              </div>

              {mailHref ? (
                <a
                  href={mailHref}
                  className="mt-4 inline-flex h-9 items-center justify-center rounded-full border border-xiio-accent/45 px-4 text-xs font-semibold text-xiio-accent transition hover:bg-xiio-accent/10"
                >
                  {t("admin.errorReports.contact", { email: item.reporterEmail ?? "" })}
                </a>
              ) : (
                <p className="mt-4 text-xs text-amber-300/80">
                  {t("admin.errorReports.noEmail")}
                </p>
              )}

              {item.adminNote && queue === "resolved" ? (
                <p className="mt-4 text-sm text-white/60">
                  {t("admin.errorReports.adminNote")}: {item.adminNote}
                </p>
              ) : null}

              {queue === "pending" ? (
                <div className="mt-4 space-y-3 border-t border-white/[0.07] pt-4">
                  <textarea
                    rows={2}
                    value={noteById[item.id] ?? ""}
                    onChange={(event) =>
                      setNoteById((current) => ({ ...current, [item.id]: event.target.value }))
                    }
                    placeholder={t("admin.errorReports.adminNotePlaceholder")}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/25"
                  />
                  <button
                    type="button"
                    disabled={busyId === item.id}
                    onClick={() => void resolve(item.id)}
                    className="inline-flex h-9 items-center justify-center rounded-full bg-white px-4 text-xs font-semibold text-black transition hover:bg-white/90 disabled:opacity-40"
                  >
                    {busyId === item.id
                      ? t("admin.loading")
                      : t("admin.errorReports.markResolved")}
                  </button>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>

      {nextCursor && !loading ? (
        <button
          type="button"
          disabled={loadingMore}
          onClick={() => void load({ cursor: nextCursor, append: true })}
          className="mt-4 rounded-lg border border-white/20 px-4 py-2 text-sm text-white hover:bg-white/5 disabled:opacity-40"
        >
          {loadingMore ? t("admin.loading") : t("admin.errorReports.loadMore")}
        </button>
      ) : null}
    </div>
  );
}
