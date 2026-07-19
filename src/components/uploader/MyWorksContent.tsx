"use client";

import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import HomeContentRow from "@/components/home/HomeContentRow";
import AppPageShell from "@/components/layout/AppPageShell";
import SectionLabel from "@/components/layout/SectionLabel";
import SubpageHeader from "@/components/layout/SubpageHeader";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/context/LocaleContext";
import { useMyWorks } from "@/hooks/useMyWorks";
import { formatApiError, formatClientError, readResponseJson } from "@/lib/clientErrors";
import { MOCKUP_HOME } from "@/lib/mockupHomeSpec";
import { aspectRatioMessageKey } from "@/lib/works/aspect-ratio";
import { gradientForTitle } from "@/lib/works/catalog-ui";
import { publishedWorksForRow, thumbnailForWork } from "@/lib/works/my-works-ui";
import {
  clearNamedUploadDraftFiles,
  clearNamedUploadDraftState,
  listUploadDraftSummaries,
  type UploadDraftSummary,
} from "@/lib/upload-draft-store";
import type { PlatformStatus, PromoPlatformStatus, StreamStatus, WorkListItem } from "@/types/work";

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

function WorkManageThumbnail({ work }: { work: WorkListItem }) {
  const thumbnailUrl = thumbnailForWork(work);
  const gradient = gradientForTitle(work.title);
  const [thumbFailed, setThumbFailed] = useState(false);

  useEffect(() => {
    setThumbFailed(false);
  }, [thumbnailUrl]);

  const showThumbnail = Boolean(thumbnailUrl) && !thumbFailed;

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-white/10 bg-white/5">
      {showThumbnail ? (
        <Image
          src={thumbnailUrl!}
          alt=""
          fill
          className="object-cover"
          sizes="(max-width: 640px) 40vw, 160px"
          unoptimized
          onError={() => setThumbFailed(true)}
        />
      ) : (
        <div className="h-full w-full" style={{ background: gradient }} aria-hidden />
      )}
      <span className="sr-only">{work.title}</span>
    </div>
  );
}

export default function MyWorksContent() {
  const searchParams = useSearchParams();
  const justSubmitted = searchParams.get("submitted") === "1";
  const { user, loading: authLoading } = useAuth();
  const { t } = useTranslations();
  const { works, loading, error, refresh } = useMyWorks();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [submitBanner, setSubmitBanner] = useState(justSubmitted);
  const [drafts, setDrafts] = useState<UploadDraftSummary[]>([]);

  const spotlightItems = useMemo(
    () => (user ? publishedWorksForRow(works, user.uid) : []),
    [works, user]
  );

  useEffect(() => {
    setSubmitBanner(justSubmitted);
  }, [justSubmitted]);

  useEffect(() => {
    if (!user) {
      setDrafts([]);
      return;
    }
    const refreshDrafts = () => setDrafts(listUploadDraftSummaries(user.uid));
    refreshDrafts();
    window.addEventListener("focus", refreshDrafts);
    window.addEventListener("storage", refreshDrafts);
    return () => {
      window.removeEventListener("focus", refreshDrafts);
      window.removeEventListener("storage", refreshDrafts);
    };
  }, [user]);

  const deleteDraft = async (draftId: string) => {
    if (!user || !window.confirm(t("myWorks.draftDeleteConfirm"))) return;
    clearNamedUploadDraftState(user.uid, draftId);
    await clearNamedUploadDraftFiles(user.uid, draftId).catch(() => undefined);
    setDrafts(listUploadDraftSummaries(user.uid));
  };

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
        const { data, raw } = await readResponseJson<{ message?: string; error?: string }>(res);
        setMsg(formatApiError(t, res.status, { ...data, message: data.message ?? raw.slice(0, 500) }));
        return;
      }
      await refresh();
    } catch (e) {
      setMsg(formatClientError(t, e, { titleKey: "myWorks.errorGeneric" }));
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
        const { data, raw } = await readResponseJson<{ message?: string; error?: string }>(res);
        setMsg(formatApiError(t, res.status, { ...data, message: data.message ?? raw.slice(0, 500) }));
        return;
      }
      await refresh();
    } catch (e) {
      setMsg(formatClientError(t, e, { titleKey: "myWorks.errorGeneric" }));
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
        const { data, raw } = await readResponseJson<{ message?: string; error?: string }>(res);
        setMsg(formatApiError(t, res.status, { ...data, message: data.message ?? raw.slice(0, 500) }));
        return;
      }
      await refresh();
      setMsg(t("myWorks.deletionRequested"));
    } catch (e) {
      setMsg(formatClientError(t, e, { titleKey: "myWorks.errorGeneric" }));
    } finally {
      setBusyId(null);
    }
  };

  if (authLoading) {
    return (
      <AppPageShell>
        <p className="text-xiio-muted py-8 text-center">{t("common.loading")}</p>
      </AppPageShell>
    );
  }

  if (!user) {
    return (
      <AppPageShell>
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <p className="text-white">{t("myWorks.loginRequired")}</p>
          <Link href="/login" className="text-xiio-accent hover:underline">
            {t("common.login")}
          </Link>
        </div>
      </AppPageShell>
    );
  }

  return (
    <AppPageShell>
      <SubpageHeader
        title={t("myWorks.title")}
        description={t("myWorks.subtitle")}
        backFallbackHref="/society"
      />

      {submitBanner ? (
        <div
          className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-emerald-300 text-sm leading-relaxed flex items-start justify-between gap-3"
          role="status"
        >
          <p>{t("uploader.submitCompleteBanner")}</p>
          <button
            type="button"
            onClick={() => setSubmitBanner(false)}
            className="shrink-0 text-emerald-400/80 hover:text-emerald-300 text-lg leading-none"
            aria-label={t("common.cancel")}
          >
            ×
          </button>
        </div>
      ) : null}

      <div className={`pb-16 flex flex-col ${MOCKUP_HOME.sectionGap}`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <SectionLabel>{t("myWorks.title")}</SectionLabel>
            <Link
              href="/uploader/analytics"
              className="inline-block mt-2 text-sm text-xiio-accent hover:underline"
            >
              {t("myWorks.viewAnalytics")}
            </Link>
          </div>
          <Link
            href="/uploader/upload"
            className={`inline-flex items-center justify-center bg-xiio-accent text-white font-medium hover:bg-xiio-accent-hover transition ${MOCKUP_HOME.ctaButton}`}
          >
            {t("myWorks.uploadNew")}
          </Link>
        </div>

        {msg ? (
          <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white">
            {msg}
          </div>
        ) : null}
        {error ? (
          <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-red-400 text-sm whitespace-pre-wrap break-words">
            {error}
          </div>
        ) : null}

        {drafts.length > 0 ? (
          <section aria-labelledby="in-progress-works">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <SectionLabel>
                  <span id="in-progress-works">{t("myWorks.inProgressTitle")}</span>
                </SectionLabel>
                <p className="mt-2 text-sm text-xiio-muted">{t("myWorks.inProgressHint")}</p>
              </div>
              <span className="rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-300">
                {t("myWorks.inProgressCount", { count: drafts.length })}
              </span>
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              {drafts.map((draft) => {
                const step = Math.max(0, Math.min(draft.stepIndex, 4));
                const title = draft.title || draft.fileName || t("myWorks.untitledDraft");
                return (
                  <article
                    key={draft.id}
                    className="group rounded-2xl border border-amber-300/20 bg-gradient-to-br from-amber-300/[0.07] to-white/[0.025] p-5"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-amber-300/20 bg-black/25 text-amber-200">
                        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
                          <path d="M4 4.5h16v15H4z" />
                          <path d="M8 2.5v4M16 2.5v4M4 9h16" />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="truncate text-base font-semibold text-white">{title}</h2>
                          <span className="rounded-full border border-amber-300/25 bg-amber-300/10 px-2 py-0.5 text-[11px] font-semibold text-amber-200">
                            {t("myWorks.status.draft")}
                          </span>
                        </div>
                        <p className="mt-1 truncate text-xs text-xiio-muted">
                          {t(`myWorks.section.${draft.section}`)}
                          {draft.fileName ? ` · ${draft.fileName}` : ""}
                        </p>
                        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                          <div
                            className="h-full rounded-full bg-amber-300 transition-all"
                            style={{ width: `${((step + 1) / 5) * 100}%` }}
                          />
                        </div>
                        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-xiio-muted">
                          <span>{t("myWorks.draftStep", { current: step + 1, total: 5 })}</span>
                          <span>{new Date(draft.savedAt).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => void deleteDraft(draft.id)}
                        className="rounded-full border border-red-400/25 px-4 py-2 text-sm font-medium text-red-300 transition hover:bg-red-400/10"
                      >
                        {t("myWorks.deleteDraft")}
                      </button>
                      <Link
                        href={`/uploader/upload?draft=${encodeURIComponent(draft.id)}`}
                        className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-black transition hover:bg-white/85"
                      >
                        {t("myWorks.resumeDraft")}
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ) : null}

        {loading ? (
          <p className="text-xiio-muted">{t("common.loading")}</p>
        ) : works.length === 0 && drafts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 p-10 text-center">
            <p className="text-xiio-muted mb-4">{t("myWorks.empty")}</p>
            <Link href="/uploader/upload" className="text-xiio-accent hover:underline text-sm">
              {t("myWorks.uploadNew")}
            </Link>
          </div>
        ) : works.length > 0 ? (
          <>
            {spotlightItems.length > 0 ? (
              <HomeContentRow
                title={t("myWorks.spotlightTitle")}
                viewAllHref="#all-works"
                viewAllLabel={t("myWorks.allWorksTitle")}
                items={spotlightItems}
                variant="featured"
              />
            ) : null}

            <section id="all-works">
              <div className="mb-4">
                <SectionLabel>{t("myWorks.allWorksTitle")}</SectionLabel>
              </div>

              <ul className="divide-y divide-white/10">
                {works.map((work, idx) => {
                  const promoStatus = work.promo?.platformStatus;
                  const canDelete =
                    work.platformStatus === "pending" || work.platformStatus === "rejected";
                  const canRequestRemoval = work.platformStatus === "published";
                  const promoPublished = promoStatus === "published";
                  const workPublished = work.platformStatus === "published";
                  const prologueStatus = work.prologue?.platformStatus;
                  const promoRevisionPending = work.promo?.revisionReviewStatus === "pending";
                  const prologueRevisionPending = work.prologue?.revisionReviewStatus === "pending";
                  const workRevisionPending = work.revisionReviewStatus === "pending";

                  return (
                    <li key={work.id} className="py-6 first:pt-0">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
                        <div className="w-full shrink-0 sm:w-40">
                          <WorkManageThumbnail work={work} />
                        </div>

                        <div className="min-w-0 flex-1 flex flex-col gap-3">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <h2 className="text-lg font-semibold text-white">{work.title}</h2>
                              <p className="text-xs text-xiio-muted mt-0.5">
                                {t(`myWorks.section.${work.section}`)} ·{" "}
                                {streamLabel(t, work.streamStatus)}
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
                                      {t("myWorks.statsFullViews")}:{" "}
                                      {(work.viewCount ?? 0).toLocaleString()}
                                    </span>
                                  )}
                                  {work.platformStatus === "published" && promoPublished && " · "}
                                  {promoPublished && work.promo && (
                                    <span>
                                      {t("myWorks.statsPromoViews")}:{" "}
                                      {(work.promo.viewCount ?? 0).toLocaleString()}
                                      {" · "}
                                      {t("myWorks.statsPromoLikes")}:{" "}
                                      {(work.promo.likeCount ?? 0).toLocaleString()}
                                    </span>
                                  )}
                                </p>
                              )}
                              {(work.proposedCategory ||
                                work.approvedCategory ||
                                (work.proposedTags?.length ?? 0) > 0) && (
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
                              <span
                                className={`px-2 py-0.5 rounded-full border ${statusBadgeClass(promoStatus!)}`}
                              >
                                {t(`myWorks.promoStatus.${promoStatus}`)}
                              </span>
                            ) : (
                              <span className="text-xiio-muted">{t("myWorks.promoNone")}</span>
                            )}
                            {promoPublished && (
                              <span className="text-emerald-400/80">{t("myWorks.promoOnHome")}</span>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-2 text-xs items-center">
                            <span className="text-xiio-muted">{t("myWorks.prologueLabel")}:</span>
                            {work.prologue ? (
                              <span
                                className={`px-2 py-0.5 rounded-full border ${statusBadgeClass(prologueStatus!)}`}
                              >
                                {t(`myWorks.promoStatus.${prologueStatus}`)}
                              </span>
                            ) : (
                              <span className="text-xiio-muted">{t("myWorks.prologueNone")}</span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2 pt-1">
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
                            {(work.promo ||
                              work.promoDraft ||
                              work.platformStatus === "draft" ||
                              (work.streamStatus === "ready" && !promoPublished)) && (
                              <Link
                                href={`/uploader/works/${work.id}/promo`}
                                className="px-3 py-1.5 text-xs rounded-lg bg-xiio-accent/20 text-xiio-accent hover:bg-xiio-accent/30 transition"
                              >
                                {work.promo || work.promoDraft
                                  ? t("myWorks.editPromo")
                                  : t("myWorks.createPromo")}
                              </Link>
                            )}
                            {workPublished && (
                              <Link
                                href={`/uploader/works/${work.id}/edit`}
                                className="px-3 py-1.5 text-xs rounded-lg border border-white/15 text-white hover:bg-white/5 transition"
                              >
                                {t("myWorks.editVideo")}
                              </Link>
                            )}
                            {workPublished && (
                              <Link
                                href={`/uploader/works/${work.id}/prologue`}
                                className="px-3 py-1.5 text-xs rounded-lg bg-white/10 text-white hover:bg-white/15 transition"
                              >
                                {work.prologue || work.prologueDraft
                                  ? t("myWorks.editPrologue")
                                  : t("myWorks.createPrologue")}
                              </Link>
                            )}
                            {(workRevisionPending ||
                              promoRevisionPending ||
                              prologueRevisionPending) && (
                              <span className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                {t("myWorks.revisionReviewPending")}
                              </span>
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
                                disabled={
                                  busyId === work.id || work.platformStatus === "removal_requested"
                                }
                                onClick={() => void requestDeletion(work.id)}
                                className="px-3 py-1.5 text-xs rounded-lg border border-orange-500/30 text-orange-400 hover:bg-orange-500/10 disabled:opacity-40"
                              >
                                {t("myWorks.requestRemoval")}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          </>
        ) : null}
      </div>
    </AppPageShell>
  );
}
