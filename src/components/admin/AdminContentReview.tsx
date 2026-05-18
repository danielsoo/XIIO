"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/context/LocaleContext";
import { AdminEntityLinks } from "@/components/admin/AdminEntityLinks";
import PlaybackVideo from "@/components/PlaybackVideo";
import FullWorkReviewCard, { type FullQueueItem } from "@/components/admin/FullWorkReviewCard";
import type { PromoPlatformStatus, RejectReasonCode, StreamStatus, WorkDoc, WorkSection } from "@/types/work";

type Tab = "full_pending" | "promo_pending" | "removal";

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
  const [tab, setTab] = useState<Tab>("full_pending");
  const [items, setItems] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectReasonCode, setRejectReasonCode] = useState<RejectReasonCode | "">("");

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
    }
  }, [user, tab, t]);

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
        body: JSON.stringify({ action, rejectReason, rejectReasonCode, ...extra }),
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

  const patchPromo = async (ownerUid: string, workId: string, action: string) => {
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
        body: JSON.stringify({ action, rejectReason }),
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
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              tab === id
                ? "bg-xiio-accent text-white"
                : "bg-white/5 text-xiio-muted hover:text-white"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-col gap-2 max-w-md">
        <label className="text-xs text-xiio-muted">{t("admin.contentReview.rejectReasonCode")}</label>
        <select
          value={rejectReasonCode}
          onChange={(e) => setRejectReasonCode(e.target.value as RejectReasonCode | "")}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
        >
          <option value="">{t("admin.contentReview.selectRejectReason")}</option>
          <option value="category_mismatch">{t("admin.contentReview.rejectCategoryMismatch")}</option>
          <option value="tag_mismatch">{t("admin.contentReview.rejectTagMismatch")}</option>
          <option value="other">{t("admin.contentReview.rejectOther")}</option>
        </select>
        <input
          type="text"
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder={t("admin.contentReview.rejectPlaceholder")}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
        />
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
              rejectReasonCode={rejectReasonCode}
              rejectReason={rejectReason}
              onApprove={(approvedCategory, approvedTags) =>
                void patchFull(item.ownerUid, item.id, "approve", {
                  approvedCategory,
                  approvedTags,
                })
              }
              onReject={() => void patchFull(item.ownerUid, item.id, "reject")}
            />
          ))}
        </ul>
      ) : tab === "promo_pending" ? (
        <ul className="space-y-4">
          {(items as PromoQueueItem[]).map((row) => (
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
                  disabled={busyKey === `promo_${row.ownerUid}_${row.workId}`}
                  onClick={() => void patchPromo(row.ownerUid, row.workId, "approve")}
                  className="px-3 py-1.5 text-xs rounded-lg bg-emerald-600/80 text-white disabled:opacity-40"
                >
                  {t("admin.contentReview.approve")}
                </button>
                <button
                  type="button"
                  disabled={busyKey === `promo_${row.ownerUid}_${row.workId}`}
                  onClick={() => void patchPromo(row.ownerUid, row.workId, "reject")}
                  className="px-3 py-1.5 text-xs rounded-lg border border-red-500/40 text-red-400 disabled:opacity-40"
                >
                  {t("admin.contentReview.reject")}
                </button>
              </div>
            </li>
          ))}
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
