"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/context/LocaleContext";
import { useMyWorks } from "@/hooks/useMyWorks";
import { aspectRatioMessageKey } from "@/lib/works/aspect-ratio";
import type { PlatformStatus, PromoPlatformStatus, StreamStatus } from "@/types/work";

function statusBadgeClass(status: PlatformStatus | PromoPlatformStatus): string {
  switch (status) {
    case "published":
      return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    case "pending":
      return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    case "rejected":
      return "bg-red-500/20 text-red-400 border-red-500/30";
    case "removal_requested":
      return "bg-orange-500/20 text-orange-400 border-orange-500/30";
    case "draft":
      return "bg-white/10 text-xiio-muted border-white/15";
    default:
      return "bg-white/10 text-xiio-muted border-white/15";
  }
}

function streamLabel(t: (k: string) => string, s: StreamStatus): string {
  return t(`myWorks.stream.${s}`);
}

export default function MyWorksContent() {
  const { user, loading: authLoading } = useAuth();
  const { t } = useTranslations();
  const { works, loading, error, refresh } = useMyWorks();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const authFetch = async (url: string, init?: RequestInit) => {
    if (!user) throw new Error("no user");
    const token = await user.getIdToken();
    return fetch(url, {
      ...init,
      headers: { Authorization: `Bearer ${token}`, ...(init?.headers ?? {}) },
    });
  };

  const move = async (workId: string, direction: "up" | "down") => {
    const idx = works.findIndex((w) => w.id === workId);
    if (idx < 0) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= works.length) return;
    const ids = works.map((w) => w.id);
    [ids[idx], ids[swapIdx]] = [ids[swapIdx], ids[idx]];
    setBusyId(workId);
    setMsg(null);
    try {
      const res = await authFetch("/api/me/works/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workIds: ids }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        setMsg(data.message ?? t("myWorks.errorGeneric"));
        return;
      }
      await refresh();
    } catch {
      setMsg(t("myWorks.errorGeneric"));
    } finally {
      setBusyId(null);
    }
  };

  const deleteWork = async (workId: string) => {
    if (!confirm(t("myWorks.confirmDelete"))) return;
    setBusyId(workId);
    setMsg(null);
    try {
      const res = await authFetch(`/api/me/works/${workId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        setMsg(data.message ?? t("myWorks.errorGeneric"));
        return;
      }
      await refresh();
    } catch {
      setMsg(t("myWorks.errorGeneric"));
    } finally {
      setBusyId(null);
    }
  };

  const requestDeletion = async (workId: string) => {
    const reason = prompt(t("myWorks.deletionReasonPrompt"));
    if (!reason?.trim()) return;
    setBusyId(workId);
    try {
      const res = await authFetch(`/api/me/works/${workId}/deletion-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        setMsg(data.message ?? t("myWorks.errorGeneric"));
        return;
      }
      await refresh();
      setMsg(t("myWorks.deletionRequested"));
    } catch {
      setMsg(t("myWorks.errorGeneric"));
    } finally {
      setBusyId(null);
    }
  };

  if (authLoading) {
    return (
      <main className="min-h-screen bg-xiio-bg flex items-center justify-center text-white">
        <p className="text-xiio-muted">{t("common.loading")}</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-xiio-bg flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-white">{t("myWorks.loginRequired")}</p>
        <Link href="/login" className="text-xiio-accent hover:underline">
          {t("common.login")}
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-xiio-bg px-4 py-16 md:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">{t("myWorks.title")}</h1>
            <p className="text-xiio-muted text-sm mt-1">{t("myWorks.subtitle")}</p>
            <Link
              href="/uploader/analytics"
              className="inline-block mt-2 text-sm text-xiio-accent hover:underline"
            >
              {t("myWorks.viewAnalytics")}
            </Link>
          </div>
          <Link
            href="/uploader/upload"
            className="inline-flex justify-center px-5 py-2.5 rounded-lg bg-xiio-accent hover:bg-xiio-accent-hover text-white text-sm font-medium transition"
          >
            {t("myWorks.uploadNew")}
          </Link>
        </div>

        {msg && (
          <div className="mb-4 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white">
            {msg}
          </div>
        )}
        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-red-400 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-xiio-muted">{t("common.loading")}</p>
        ) : works.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 p-10 text-center">
            <p className="text-xiio-muted mb-4">{t("myWorks.empty")}</p>
            <Link href="/uploader/upload" className="text-xiio-accent hover:underline text-sm">
              {t("myWorks.uploadNew")}
            </Link>
          </div>
        ) : (
          <ul className="space-y-4">
            {works.map((work, idx) => {
              const promoStatus = work.promo?.platformStatus;
              const canDelete =
                work.platformStatus === "pending" || work.platformStatus === "rejected";
              const canRequestRemoval = work.platformStatus === "published";
              const promoPublished = promoStatus === "published";

              return (
                <li
                  key={work.id}
                  className="rounded-2xl border border-white/10 bg-xiio-surface p-5 flex flex-col gap-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h2 className="text-lg font-semibold text-white">{work.title}</h2>
                      <p className="text-xs text-xiio-muted mt-0.5">
                        {t(`myWorks.section.${work.section}`)} · {streamLabel(t, work.streamStatus)}
                        {(work.approvedAspectRatio ?? work.proposedAspectRatio) && (
                          <>
                            {" "}
                            ·{" "}
                            {t(
                              aspectRatioMessageKey(
                                work.approvedAspectRatio ?? work.proposedAspectRatio!
                              )
                            )}
                          </>
                        )}
                      </p>
                      {(work.platformStatus === "published" || promoPublished) && (
                        <p className="text-xs text-white/60 mt-1 tabular-nums">
                          {work.platformStatus === "published" && (
                            <span>
                              {t("myWorks.statsFullViews")}: {(work.viewCount ?? 0).toLocaleString()}
                            </span>
                          )}
                          {work.platformStatus === "published" && promoPublished && " · "}
                          {promoPublished && work.promo && (
                            <span>
                              {t("myWorks.statsPromoViews")}: {(work.promo.viewCount ?? 0).toLocaleString()}
                              {" · "}
                              {t("myWorks.statsPromoLikes")}: {(work.promo.likeCount ?? 0).toLocaleString()}
                            </span>
                          )}
                        </p>
                      )}
                      {(work.proposedCategory || work.approvedCategory || (work.proposedTags?.length ?? 0) > 0) && (
                        <p className="text-xs text-xiio-muted mt-1">
                          {work.platformStatus === "published" && work.approvedCategory
                            ? work.approvedCategory
                            : work.proposedCategory}
                          {(work.platformStatus === "published"
                            ? work.approvedTags
                            : work.proposedTags)?.length
                            ? ` · ${(work.platformStatus === "published" ? work.approvedTags : work.proposedTags)!.join(", ")}`
                            : null}
                        </p>
                      )}
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full border ${statusBadgeClass(work.platformStatus)}`}
                    >
                      {t(`myWorks.status.${work.platformStatus}`)}
                    </span>
                  </div>

                  {work.platformStatus === "rejected" && (
                    <div className="text-sm text-red-400/90 space-y-0.5">
                      {work.rejectReasonCode && (
                        <p className="font-medium">
                          {t(`myWorks.rejectReason.${work.rejectReasonCode}`)}
                        </p>
                      )}
                      {work.rejectReason && <p>{work.rejectReason}</p>}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 text-xs items-center">
                    <span className="text-xiio-muted">{t("myWorks.promoLabel")}:</span>
                    {work.promo ? (
                      <span className={`px-2 py-0.5 rounded-full border ${statusBadgeClass(promoStatus!)}`}>
                        {t(`myWorks.promoStatus.${promoStatus}`)}
                      </span>
                    ) : (
                      <span className="text-xiio-muted">{t("myWorks.promoNone")}</span>
                    )}
                    {promoPublished && (
                      <span className="text-emerald-400/80">{t("myWorks.promoOnHome")}</span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      disabled={idx === 0 || busyId === work.id}
                      onClick={() => void move(work.id, "up")}
                      className="px-3 py-1.5 text-xs rounded-lg border border-white/15 text-white hover:bg-white/5 disabled:opacity-30"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      disabled={idx === works.length - 1 || busyId === work.id}
                      onClick={() => void move(work.id, "down")}
                      className="px-3 py-1.5 text-xs rounded-lg border border-white/15 text-white hover:bg-white/5 disabled:opacity-30"
                    >
                      ↓
                    </button>
                    {work.streamStatus === "ready" && (
                      <Link
                        href={`/uploader/works/${work.id}/promo`}
                        className="px-3 py-1.5 text-xs rounded-lg bg-xiio-accent/20 text-xiio-accent hover:bg-xiio-accent/30 transition"
                      >
                        {work.promo ? t("myWorks.editPromo") : t("myWorks.createPromo")}
                      </Link>
                    )}
                    {canDelete && (
                      <button
                        type="button"
                        disabled={busyId === work.id}
                        onClick={() => void deleteWork(work.id)}
                        className="px-3 py-1.5 text-xs rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 disabled:opacity-40"
                      >
                        {t("myWorks.delete")}
                      </button>
                    )}
                    {canRequestRemoval && (
                      <button
                        type="button"
                        disabled={busyId === work.id || work.platformStatus === "removal_requested"}
                        onClick={() => void requestDeletion(work.id)}
                        className="px-3 py-1.5 text-xs rounded-lg border border-orange-500/30 text-orange-400 hover:bg-orange-500/10 disabled:opacity-40"
                      >
                        {t("myWorks.requestRemoval")}
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <Link href="/" className="block text-center text-sm text-xiio-muted hover:text-white mt-10 transition">
          {t("common.home")}
        </Link>
      </div>
    </main>
  );
}
