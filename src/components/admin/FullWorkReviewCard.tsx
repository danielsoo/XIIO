"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminEntityLinks } from "@/components/admin/AdminEntityLinks";
import RejectReasonFields, { canSubmitReject } from "@/components/admin/RejectReasonFields";
import PlaybackVideo from "@/components/PlaybackVideo";
import { useTranslations } from "@/context/LocaleContext";
import { aspectRatioMessageKey } from "@/lib/works/aspect-ratio";
import type { WorkDoc } from "@/types/work";
import type { RejectReasonCode } from "@/types/work";

export type FullQueueItem = WorkDoc & {
  id: string;
  ownerUid: string;
  ownerEmail: string | null;
  ownerName: string | null;
  playbackUrl?: string;
  isRevision?: boolean;
};

type Props = {
  item: FullQueueItem;
  busy: boolean;
  onApprove: (approvedCategory: string, approvedTags: string[]) => void;
  onReject: (rejectReasonCode: RejectReasonCode, rejectReason: string) => void;
};

export default function FullWorkReviewCard({ item, busy, onApprove, onReject }: Props) {
  const { t } = useTranslations();
  const [approvedCategory, setApprovedCategory] = useState(item.proposedCategory ?? "");
  const [tagsText, setTagsText] = useState((item.proposedTags ?? []).join(", "));
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReasonCode, setRejectReasonCode] = useState<RejectReasonCode | "">("");
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    setApprovedCategory(item.proposedCategory ?? "");
    setTagsText((item.proposedTags ?? []).join(", "));
    setRejectOpen(false);
    setRejectReasonCode("");
    setRejectReason("");
  }, [item.id, item.proposedCategory, item.proposedTags]);

  const canConfirmReject = canSubmitReject(rejectReasonCode, rejectReason, true);

  const openReject = () => {
    setRejectOpen(true);
    setRejectReasonCode("");
    setRejectReason("");
  };

  const confirmReject = () => {
    if (!canConfirmReject || !rejectReasonCode) return;
    onReject(rejectReasonCode, rejectReason);
  };

  return (
    <li className="rounded-2xl border border-white/10 bg-xiio-surface p-5">
      <div className="flex flex-wrap justify-between gap-2 mb-2">
        <div>
          <h2 className="text-lg font-semibold text-white flex flex-wrap items-center gap-2">
            <Link
              href={`/admin/content/works/${item.ownerUid}/${item.id}`}
              className="hover:text-xiio-accent transition"
            >
              {item.title}
            </Link>
            {item.isRevision && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                {t("admin.contentReview.revisionBadge")}
              </span>
            )}
          </h2>
          <p className="text-xs text-xiio-muted mt-0.5">
            <Link
              href={`/admin/users/${item.ownerUid}`}
              className="text-xiio-accent hover:underline"
            >
              {item.ownerName ?? item.ownerEmail ?? item.ownerUid}
            </Link>{" "}
            · {t(`myWorks.section.${item.section}`)} · {item.streamStatus}
          </p>
          <AdminEntityLinks ownerUid={item.ownerUid} workId={item.id} className="mt-2" />
        </div>
      </div>

      <div className="text-sm text-xiio-muted mb-3 space-y-1">
        <p>
          <span className="text-white/70">{t("admin.contentReview.proposedCategory")}: </span>
          {item.proposedCategory || "—"}
        </p>
        <p>
          <span className="text-white/70">{t("admin.contentReview.proposedTags")}: </span>
          {(item.proposedTags ?? []).length > 0 ? item.proposedTags!.join(", ") : "—"}
        </p>
        <p>
          <span className="text-white/70">{t("admin.contentReview.proposedAspectRatio")}: </span>
          {item.proposedAspectRatio ? t(aspectRatioMessageKey(item.proposedAspectRatio)) : "—"}
        </p>
      </div>

      {item.playbackUrl && (
        <div className="mb-3 max-w-3xl">
          <PlaybackVideo src={item.playbackUrl} />
        </div>
      )}

      <div className="grid gap-3 mb-3 max-w-lg">
        <div>
          <label className="block text-xs text-xiio-muted mb-1">{t("admin.contentReview.approvedCategory")}</label>
          <input
            type="text"
            value={approvedCategory}
            onChange={(e) => setApprovedCategory(e.target.value)}
            disabled={rejectOpen}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white disabled:opacity-50"
          />
        </div>
        <div>
          <label className="block text-xs text-xiio-muted mb-1">{t("admin.contentReview.approvedTags")}</label>
          <input
            type="text"
            value={tagsText}
            onChange={(e) => setTagsText(e.target.value)}
            disabled={rejectOpen}
            placeholder={t("admin.contentReview.tagsPlaceholder")}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white disabled:opacity-50"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 items-start">
        <button
          type="button"
          disabled={busy || item.streamStatus !== "ready" || rejectOpen}
          onClick={() =>
            onApprove(
              approvedCategory,
              tagsText
                .split(/[,，、]/)
                .map((s) => s.trim())
                .filter(Boolean)
            )
          }
          className="px-3 py-1.5 text-xs rounded-lg bg-emerald-600/80 text-white disabled:opacity-40"
        >
          {t("admin.contentReview.approve")}
        </button>
        {!rejectOpen ? (
          <button
            type="button"
            disabled={busy}
            onClick={openReject}
            className="px-3 py-1.5 text-xs rounded-lg border border-red-500/40 text-red-400 hover:bg-red-500/10 disabled:opacity-40"
          >
            {t("admin.contentReview.reject")}
          </button>
        ) : (
          <>
            <button
              type="button"
              disabled={busy || !canConfirmReject}
              onClick={confirmReject}
              className="px-3 py-1.5 text-xs rounded-lg bg-red-600/80 text-white disabled:opacity-40"
            >
              {t("admin.contentReview.rejectConfirm")}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setRejectOpen(false)}
              className="px-3 py-1.5 text-xs rounded-lg border border-white/20 text-white hover:bg-white/5 disabled:opacity-40"
            >
              {t("common.cancel")}
            </button>
          </>
        )}
      </div>

      {rejectOpen && (
        <RejectReasonFields
          rejectReasonCode={rejectReasonCode}
          rejectReason={rejectReason}
          onCodeChange={setRejectReasonCode}
          onReasonChange={setRejectReason}
        />
      )}
    </li>
  );
}
