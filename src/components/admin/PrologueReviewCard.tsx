"use client";

import Link from "next/link";
import { useState } from "react";
import { AdminEntityLinks } from "@/components/admin/AdminEntityLinks";
import ModerationFlagsPanel from "@/components/admin/ModerationFlagsPanel";
import type { ContentModeration } from "@/types/moderation";
import AdminReviewVideo from "@/components/admin/AdminReviewVideo";
import RejectReasonFields, { canSubmitReject } from "@/components/admin/RejectReasonFields";
import { useTranslations } from "@/context/LocaleContext";
import { resolveDisplayTitle } from "@/lib/works/display-title";
import { isLongDescription } from "@/lib/works/description";
import { aspectRatioMessageKey } from "@/lib/works/aspect-ratio";
import type { PromoPlatformStatus, StreamStatus, WorkDoc } from "@/types/work";

export type PrologueReviewItem = {
  workId: string;
  ownerUid: string;
  ownerEmail: string | null;
  ownerName: string | null;
  isRevision?: boolean;
  work: WorkDoc & { id?: string };
  prologue: {
    id: string;
    platformStatus: PromoPlatformStatus;
    streamStatus?: StreamStatus;
    playbackUrl?: string;
    title?: string;
    description?: string;
    durationSec?: number;
    contentModeration?: ContentModeration;
    pendingRevision?: { contentModeration?: ContentModeration };
  };
  livePrologue?: {
    title?: string;
    description?: string;
    playbackUrl?: string;
    durationSec?: number;
  };
};

type Props = {
  row: PrologueReviewItem;
  busy: boolean;
  rejectOpen: boolean;
  rejectReason: string;
  onRejectOpen: () => void;
  onRejectCancel: () => void;
  onApprove: () => void;
  onRejectConfirm: () => void;
  onRejectReasonChange: (value: string) => void;
};

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <p className="text-sm">
      <span className="text-white/70">{label}: </span>
      <span className="text-white/90 whitespace-pre-wrap break-words">{value || "—"}</span>
    </p>
  );
}

export default function PrologueReviewCard({
  row,
  busy,
  rejectOpen,
  rejectReason,
  onRejectOpen,
  onRejectCancel,
  onApprove,
  onRejectConfirm,
  onRejectReasonChange,
}: Props) {
  const { t } = useTranslations();
  const untitledLabel = t("common.untitled");
  const { work, prologue, livePrologue, isRevision } = row;
  const workDisplayTitle = resolveDisplayTitle(untitledLabel, work.title);
  const prologueTitle = resolveDisplayTitle(untitledLabel, prologue.title, work.title);
  const [descExpanded, setDescExpanded] = useState(false);
  const description = prologue.description ?? "—";
  const longDesc = isLongDescription(description);

  const moderation =
    isRevision && prologue.pendingRevision?.contentModeration
      ? prologue.pendingRevision.contentModeration
      : prologue.contentModeration;

  return (
    <li className="rounded-2xl border border-white/10 bg-xiio-surface p-5 space-y-4">
      {isRevision && (
        <p className="text-xs font-medium text-amber-300">{t("admin.contentReview.revisionBadge")}</p>
      )}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">
            <Link
              href={`/admin/content/works/${row.ownerUid}/${row.workId}`}
              className="hover:text-xiio-accent transition"
            >
              {prologueTitle}
            </Link>
          </h2>
          <p className="text-xs text-xiio-muted mt-1">
            {t("admin.contentReview.parentWork")}: {workDisplayTitle}
          </p>
        </div>
        <AdminEntityLinks ownerUid={row.ownerUid} workId={row.workId} />
      </div>

      <MetaRow label={t("admin.contentReview.workSection")} value={t(`myWorks.section.${work.section}`)} />
      {work.approvedAspectRatio && (
        <p className="text-sm">
          <span className="text-white/70">{t("admin.contentReview.proposedAspectRatio")}: </span>
          <span className="text-white/90">{t(aspectRatioMessageKey(work.approvedAspectRatio))}</span>
        </p>
      )}
      <MetaRow label={t("admin.contentReview.prologueTitle")} value={prologueTitle} />
      <div>
        <span className="text-sm text-white/70">{t("admin.contentReview.prologueDescription")}:</span>
        <p
          className={`text-sm text-white/90 whitespace-pre-wrap break-words mt-0.5 ${
            !descExpanded && longDesc ? "line-clamp-4" : ""
          }`}
        >
          {description}
        </p>
        {longDesc && (
          <button
            type="button"
            onClick={() => setDescExpanded((v) => !v)}
            className="text-xs text-xiio-accent hover:underline mt-1"
          >
            {descExpanded
              ? t("admin.contentReview.descriptionShowLess")
              : t("admin.contentReview.descriptionShowMore")}
          </button>
        )}
      </div>
      {prologue.durationSec != null && (
        <p className="text-sm text-white/70">
          {t("admin.contentReview.prologueDuration", { sec: prologue.durationSec.toFixed(1) })}
        </p>
      )}
      {prologue.streamStatus && (
        <p className="text-sm text-white/70">
          {t("admin.contentReview.streamStatus")}: {t(`myWorks.stream.${prologue.streamStatus}`)}
        </p>
      )}

      {moderation && <ModerationFlagsPanel moderation={moderation} />}

      {isRevision && livePrologue ? (
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs text-xiio-muted mb-2">{t("admin.contentReview.pendingPrologue")}</p>
            {prologue.playbackUrl ? (
              <AdminReviewVideo src={prologue.playbackUrl} />
            ) : (
              <p className="text-sm text-white/50">{t("admin.contentReview.prologueNotReady")}</p>
            )}
          </div>
          <div>
            <p className="text-xs text-xiio-muted mb-2">{t("admin.contentReview.livePrologue")}</p>
            {livePrologue.playbackUrl ? (
              <AdminReviewVideo src={livePrologue.playbackUrl} />
            ) : (
              <p className="text-sm text-white/50">{t("admin.contentReview.noLiveVideo")}</p>
            )}
          </div>
        </div>
      ) : (
        <div className="max-w-3xl">
          {prologue.playbackUrl ? (
            <AdminReviewVideo src={prologue.playbackUrl} />
          ) : (
            <p className="text-sm text-white/50">{t("admin.contentReview.prologueNotReady")}</p>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2 pt-2">
        <button
          type="button"
          disabled={busy || !prologue.playbackUrl}
          onClick={onApprove}
          className="px-4 py-2 text-sm rounded-lg bg-emerald-600 text-white disabled:opacity-40"
        >
          {t("admin.contentReview.approve")}
        </button>
        {!rejectOpen ? (
          <button
            type="button"
            disabled={busy}
            onClick={onRejectOpen}
            className="px-4 py-2 text-sm rounded-lg border border-red-500/40 text-red-300 disabled:opacity-40"
          >
            {t("admin.contentReview.reject")}
          </button>
        ) : (
          <div className="w-full space-y-2">
            <RejectReasonFields
              showCodeSelect={false}
              rejectReasonCode=""
              rejectReason={rejectReason}
              onCodeChange={() => {}}
              onReasonChange={onRejectReasonChange}
            />
            <div className="flex gap-2">
              <button
                type="button"
                disabled={busy || !canSubmitReject("", rejectReason, false)}
                onClick={onRejectConfirm}
                className="px-3 py-1.5 text-xs rounded-lg bg-red-600 text-white disabled:opacity-40"
              >
                {t("admin.contentReview.rejectConfirm")}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={onRejectCancel}
                className="px-3 py-1.5 text-xs rounded-lg border border-white/20 text-white"
              >
                {t("report.cancel")}
              </button>
            </div>
          </div>
        )}
      </div>
    </li>
  );
}
