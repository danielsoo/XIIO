"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminEntityLinks } from "@/components/admin/AdminEntityLinks";
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
};

type Props = {
  item: FullQueueItem;
  busy: boolean;
  rejectReasonCode: RejectReasonCode | "";
  rejectReason: string;
  onApprove: (approvedCategory: string, approvedTags: string[]) => void;
  onReject: () => void;
};

export default function FullWorkReviewCard({
  item,
  busy,
  rejectReasonCode,
  rejectReason,
  onApprove,
  onReject,
}: Props) {
  const { t } = useTranslations();
  const [approvedCategory, setApprovedCategory] = useState(item.proposedCategory ?? "");
  const [tagsText, setTagsText] = useState((item.proposedTags ?? []).join(", "));

  useEffect(() => {
    setApprovedCategory(item.proposedCategory ?? "");
    setTagsText((item.proposedTags ?? []).join(", "));
  }, [item.id, item.proposedCategory, item.proposedTags]);

  const canReject = rejectReasonCode !== "" && (rejectReasonCode !== "other" || rejectReason.trim().length > 0);

  return (
    <li className="rounded-2xl border border-white/10 bg-xiio-surface p-5">
      <div className="flex flex-wrap justify-between gap-2 mb-2">
        <div>
          <h2 className="text-lg font-semibold text-white">
            <Link
              href={`/admin/content/works/${item.ownerUid}/${item.id}`}
              className="hover:text-xiio-accent transition"
            >
              {item.title}
            </Link>
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
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
          />
        </div>
        <div>
          <label className="block text-xs text-xiio-muted mb-1">{t("admin.contentReview.approvedTags")}</label>
          <input
            type="text"
            value={tagsText}
            onChange={(e) => setTagsText(e.target.value)}
            placeholder={t("admin.contentReview.tagsPlaceholder")}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy || item.streamStatus !== "ready"}
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
        <button
          type="button"
          disabled={busy || !canReject}
          onClick={onReject}
          className="px-3 py-1.5 text-xs rounded-lg border border-red-500/40 text-red-400 disabled:opacity-40"
        >
          {t("admin.contentReview.reject")}
        </button>
      </div>
    </li>
  );
}
