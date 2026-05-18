"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/context/LocaleContext";
import { AdminEntityLinks } from "@/components/admin/AdminEntityLinks";
import PlaybackVideo from "@/components/PlaybackVideo";
import FullWorkReviewCard, { type FullQueueItem } from "@/components/admin/FullWorkReviewCard";
import RejectReasonFields, { canSubmitReject } from "@/components/admin/RejectReasonFields";
import { useAdminWorkStats, type AdminWorkStats } from "@/hooks/useAdminWorkStats";
import type { PromoPlatformStatus, StreamStatus, WorkDoc, WorkSection } from "@/types/work";

type Tab = "full_pending" | "promo_pending" | "removal";

function tabPendingCount(tab: Tab, stats: AdminWorkStats | null): number {
  if (!stats) return 0;
  if (tab === "full_pending") return stats.pendingFull;
  if (tab === "promo_pending") return stats.pendingPromo;
  return stats.removalRequested;
}

type PromoQueueItem = {
  workId: string;
  ownerUid: string;
  ownerEmail: string | null;
  ownerName: string | null;
  work: WorkDoc;
  promo: {
    id: string;
    platformStatus: PromoPlatformStatus;
    playbackUrl?: string;
    title?: string;
    clipStartSec: number;
    clipEndSec: number;
  };
};

type RemovalItem = {
  kind: "full" | "promo";
  workId: string;
  ownerUid: string;
  ownerEmail: string | null;
  ownerName: string | null;
  title?: string;
  section?: WorkSection;
  platformStatus?: string;
  streamStatus?: StreamStatus;
  deletionRequest?: { reason: string };
  playbackUrl?: string;
};

export default function AdminContentReview() {
  const { user } = useAuth();
  const { t } = useTranslations();
  const { stats, refresh: refreshStats } = useAdminWorkStats(!!user);
  const [tab, setTab] = useState<Tab>("full_pending");
  const [items, setItems] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [promoRejectOpenKey, setPromoRejectOpenKey] = useState<string | null>(null);
  const [promoRejectReason, setPromoRejectReason] = useState("");

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setErr(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/admin/works?queue=${tab}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await res.json().catch(() => ({}))) as { items?: unknown[]; message?: string };
      if (!res.ok) {
        setErr(data.message ?? `HTTP ${res.status}`);
        setItems([]);
        return;
      }
      setItems(data.items ?? []);
    } catch {
      setErr(t("admin.contentReview.loadError"));
    } finally {
      setLoading(false);
      void refreshStats();
    }
  }, [user, tab, t, refreshStats]);

  useEffect(() => {
    void load();
  }, [load]);

  const patchFull = async (ownerUid: string, workId: string, action: string, extra?: object) => {
    if (!user) return;
    setBusyKey(`${ownerUid}_${workId}`);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/admin/works/${ownerUid}/${workId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action, ...extra }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        setErr(data.message ?? t("admin.contentReview.actionFailed"));
        return;
      }
      await load();
    } finally {
      setBusyKey(null);
    }
  };

  const patchPromo = async (
    ownerUid: string,
    workId: string,
    action: string,
    extra?: { rejectReason?: string }
  ) => {
    if (!user) return;
    setBusyKey(`promo_${ownerUid}_${workId}`);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/admin/works/${ownerUid}/${workId}/promo`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action, ...extra }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        setErr(data.message ?? t("admin.contentReview.actionFailed"));
        return;
      }
      await load();
      setPromoRejectOpenKey(null);
      setPromoRejectReason("");
    } finally {
      setBusyKey(null);
    }
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "full_pending", label: t("admin.contentReview.tabFull") },
    { id: "promo_pending", label: t("admin.contentReview.tabPromo") },
    { id: "removal", label: t("admin.contentReview.tabRemoval") },
  ];

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">{t("admin.contentTitle")}</h1>
      <p className="text-xiio-muted text-sm mb-6">{t("admin.contentDesc")}</p>

      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map(({ id, label }) => {
          const count = tabPendingCount(id, stats);
          return (
            <button
              key={id}
              type="button"
              onClick={() => {
                setTab(id);
                setPromoRejectOpenKey(null);
                setPromoRejectReason("");
              }}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                tab === id
                  ? "bg-xiio-accent text-white"
                  : "bg-white/5 text-xiio-muted hover:text-white"
              }`}
            >
              <span>{label}</span>
              {count > 0 && (
                <span className="min-w-[1.25rem] h-5 px-1.5 rounded-full bg-amber-500 text-black text-xs font-bold flex items-center justify-center">
                  {count > 99 ? "99+" : count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {err && (
        <p className="mb-4 text-red-400 text-sm">{err}</p>
      )}

      {loading ? (
        <p className="text-xiio-muted">{t("admin.loading")}</p>
      ) : items.length === 0 ? (
        <p className="text-xiio-muted">{t("admin.contentReview.empty")}</p>
      ) : tab === "full_pending" ? (
        <ul className="space-y-4">
          {(items as FullQueueItem[]).map((item) => (
            <FullWorkReviewCard
              key={item.id}
              item={item}
              busy={busyKey === `${item.ownerUid}_${item.id}`}
              onApprove={(approvedCategory, approvedTags) =>
                void patchFull(item.ownerUid, item.id, "approve", {
                  approvedCategory,
                  approvedTags,
                })
              }
              onReject={(rejectReasonCode, rejectReason) =>
                void patchFull(item.ownerUid, item.id, "reject", {
                  rejectReasonCode,
                  rejectReason,
                })
              }
            />
          ))}
        </ul>
      ) : tab === "promo_pending" ? (
        <ul className="space-y-4">
          {(items as PromoQueueItem[]).map((row) => {
            const promoKey = `promo_${row.ownerUid}_${row.workId}`;
            const rejectOpen = promoRejectOpenKey === promoKey;
            const canPromoReject = canSubmitReject("", promoRejectReason, false);

            return (
            <li
              key={`${row.ownerUid}_${row.workId}`}
              className="rounded-2xl border border-white/10 bg-xiio-surface p-5"
            >
              <h2 className="text-lg font-semibold text-white">
                <Link
                  href={`/admin/content/works/${row.ownerUid}/${row.workId}`}
                  className="hover:text-xiio-accent transition"
                >
                  {row.promo.title ?? row.work.title}
                </Link>
              </h2>
              <p className="text-xs text-xiio-muted mb-2">
                <Link
                  href={`/admin/users/${row.ownerUid}`}
                  className="text-xiio-accent hover:underline"
                >
                  {row.ownerName ?? row.ownerEmail ?? row.ownerUid}
                </Link>{" "}
                · {row.work.title} · {row.promo.clipStartSec}s–{row.promo.clipEndSec}s
              </p>
              <AdminEntityLinks
                ownerUid={row.ownerUid}
                workId={row.workId}
                className="mb-3"
              />
              {row.promo.playbackUrl && (
                <div className="mb-3 max-w-3xl">
                  <PlaybackVideo src={row.promo.playbackUrl} maxHeightClass="max-h-[60vh]" />
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busyKey === promoKey || rejectOpen}
                  onClick={() => void patchPromo(row.ownerUid, row.workId, "approve")}
                  className="px-3 py-1.5 text-xs rounded-lg bg-emerald-600/80 text-white disabled:opacity-40"
                >
                  {t("admin.contentReview.approve")}
                </button>
                {!rejectOpen ? (
                  <button
                    type="button"
                    disabled={busyKey === promoKey}
                    onClick={() => {
                      setPromoRejectOpenKey(promoKey);
                      setPromoRejectReason("");
                    }}
                    className="px-3 py-1.5 text-xs rounded-lg border border-red-500/40 text-red-400 hover:bg-red-500/10 disabled:opacity-40"
                  >
                    {t("admin.contentReview.reject")}
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      disabled={busyKey === promoKey || !canPromoReject}
                      onClick={() =>
                        void patchPromo(row.ownerUid, row.workId, "reject", {
                          rejectReason: promoRejectReason.trim(),
                        })
                      }
                      className="px-3 py-1.5 text-xs rounded-lg bg-red-600/80 text-white disabled:opacity-40"
                    >
                      {t("admin.contentReview.rejectConfirm")}
                    </button>
                    <button
                      type="button"
                      disabled={busyKey === promoKey}
                      onClick={() => {
                        setPromoRejectOpenKey(null);
                        setPromoRejectReason("");
                      }}
                      className="px-3 py-1.5 text-xs rounded-lg border border-white/20 text-white hover:bg-white/5 disabled:opacity-40"
                    >
                      {t("common.cancel")}
                    </button>
                  </>
                )}
              </div>
              {rejectOpen && (
                <RejectReasonFields
                  showCodeSelect={false}
                  rejectReasonCode=""
                  rejectReason={promoRejectReason}
                  onCodeChange={() => {}}
                  onReasonChange={setPromoRejectReason}
                />
              )}
            </li>
            );
          })}
        </ul>
      ) : (
        <ul className="space-y-4">
          {(items as RemovalItem[]).map((item) => (
            <li
              key={`${item.kind}_${item.ownerUid}_${item.workId}`}
              className="rounded-2xl border border-orange-500/20 bg-xiio-surface p-5"
            >
              <p className="text-xs text-orange-400 mb-1">
                {item.kind === "full"
                  ? t("admin.contentReview.kindFull")
                  : t("admin.contentReview.kindPromo")}
              </p>
              <h2 className="text-lg font-semibold text-white">
                <Link
                  href={`/admin/content/works/${item.ownerUid}/${item.workId}`}
                  className="hover:text-xiio-accent transition"
                >
                  {item.title}
                </Link>
              </h2>
              <p className="text-sm text-xiio-muted mt-1">{item.deletionRequest?.reason}</p>
              <p className="text-xs text-xiio-muted mt-1">
                <Link
                  href={`/admin/users/${item.ownerUid}`}
                  className="text-xiio-accent hover:underline"
                >
                  {item.ownerName ?? item.ownerEmail ?? item.ownerUid}
                </Link>
                {item.section && (
                  <>
                    {" "}
                    · {t(`myWorks.section.${item.section}`)}
                  </>
                )}
              </p>
              <AdminEntityLinks
                ownerUid={item.ownerUid}
                workId={item.workId}
                className="my-3"
              />
              {item.playbackUrl && (
                <div className="mb-3 max-w-3xl">
                  <PlaybackVideo src={item.playbackUrl} maxHeightClass="max-h-[60vh]" />
                </div>
              )}
              <div className="flex flex-wrap gap-2 mt-3">
                {item.kind === "full" ? (
                  <>
                    <button
                      type="button"
                      disabled={busyKey === `${item.ownerUid}_${item.workId}`}
                      onClick={() => void patchFull(item.ownerUid, item.workId, "approve_removal")}
                      className="px-3 py-1.5 text-xs rounded-lg bg-red-600/80 text-white disabled:opacity-40"
                    >
                      {t("admin.contentReview.approveRemoval")}
                    </button>
                    <button
                      type="button"
                      disabled={busyKey === `${item.ownerUid}_${item.workId}`}
                      onClick={() => void patchFull(item.ownerUid, item.workId, "reject_removal")}
                      className="px-3 py-1.5 text-xs rounded-lg border border-white/20 text-white disabled:opacity-40"
                    >
                      {t("admin.contentReview.rejectRemoval")}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      disabled={busyKey === `promo_${item.ownerUid}_${item.workId}`}
                      onClick={() => void patchPromo(item.ownerUid, item.workId, "approve_removal")}
                      className="px-3 py-1.5 text-xs rounded-lg bg-red-600/80 text-white disabled:opacity-40"
                    >
                      {t("admin.contentReview.approveRemoval")}
                    </button>
                    <button
                      type="button"
                      disabled={busyKey === `promo_${item.ownerUid}_${item.workId}`}
                      onClick={() => void patchPromo(item.ownerUid, item.workId, "reject_removal")}
                      className="px-3 py-1.5 text-xs rounded-lg border border-white/20 text-white disabled:opacity-40"
                    >
                      {t("admin.contentReview.rejectRemoval")}
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
