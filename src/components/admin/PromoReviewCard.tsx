"use client";

import Link from "next/link";
import { AdminEntityLinks } from "@/components/admin/AdminEntityLinks";
import PlaybackVideo from "@/components/PlaybackVideo";
import RejectReasonFields, { canSubmitReject } from "@/components/admin/RejectReasonFields";
import { useTranslations } from "@/context/LocaleContext";
import { aspectRatioMessageKey } from "@/lib/works/aspect-ratio";
import type { PromoPlatformStatus, StreamStatus, WorkDoc } from "@/types/work";

export type PromoLiveSnapshot = {
  title?: string;
  description?: string;
  clipStartSec: number;
  clipEndSec: number;
  playbackUrl?: string;
};

export type PromoReviewItem = {
  workId: string;
  ownerUid: string;
  ownerEmail: string | null;
  ownerName: string | null;
  isRevision?: boolean;
  work: WorkDoc & { id?: string };
  promo: {
    id: string;
    platformStatus: PromoPlatformStatus;
    streamStatus?: StreamStatus;
    playbackUrl?: string;
    title?: string;
    description?: string;
    clipStartSec: number;
    clipEndSec: number;
  };
  livePromo?: PromoLiveSnapshot;
};

type Props = {
  row: PromoReviewItem;
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

function PromoMetaBlock({
  heading,
  title,
  description,
  clipStartSec,
  clipEndSec,
  streamStatus,
  t,
}: {
  heading?: string;
  title?: string;
  description?: string;
  clipStartSec: number;
  clipEndSec: number;
  streamStatus?: StreamStatus;
  t: (key: string, params?: Record<string, string | number>) => string;
}) {
  const clipSec = (clipEndSec - clipStartSec).toFixed(1);
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-4 space-y-2">
      {heading && <p className="text-xs font-semibold text-xiio-accent uppercase tracking-wide">{heading}</p>}
      <MetaRow label={t("admin.contentReview.promoTitle")} value={title ?? "—"} />
      <MetaRow label={t("admin.contentReview.promoDescription")} value={description ?? "—"} />
      <p className="text-sm text-white/90">
        <span className="text-white/70">{t("admin.contentReview.promoClip")}: </span>
        {t("admin.contentReview.promoClipRange", {
          start: clipStartSec.toFixed(1),
          end: clipEndSec.toFixed(1),
          sec: clipSec,
        })}
      </p>
      {streamStatus && (
        <p className="text-xs text-xiio-muted">
          {t("admin.contentReview.streamStatus")}: {t(`myWorks.stream.${streamStatus}`)}
        </p>
      )}
    </div>
  );
}

export default function PromoReviewCard({
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
  const canPromoReject = canSubmitReject("", rejectReason, false);
  const work = row.work;
  const promo = row.promo;
  return (
    <li className="rounded-2xl border border-white/10 bg-xiio-surface p-5">
      <h2 className="text-lg font-semibold text-white flex flex-wrap items-center gap-2">
        <Link
          href={`/admin/content/works/${row.ownerUid}/${row.workId}`}
          className="hover:text-xiio-accent transition"
        >
          {promo.title ?? work.title}
        </Link>
        {row.isRevision && (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
            {t("admin.contentReview.revisionBadge")}
          </span>
        )}
      </h2>
      <p className="text-xs text-xiio-muted mb-3">
        <Link href={`/admin/users/${row.ownerUid}`} className="text-xiio-accent hover:underline">
          {row.ownerName ?? row.ownerEmail ?? row.ownerUid}
        </Link>
      </p>
      <AdminEntityLinks ownerUid={row.ownerUid} workId={row.workId} className="mb-4" />

      <div className="mb-4 rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-2">
        <p className="text-xs font-semibold text-white/80">{t("admin.contentReview.parentWork")}</p>
        <MetaRow label={t("admin.contentReview.workTitle")} value={work.title} />
        <MetaRow
          label={t("admin.contentReview.workSection")}
          value={t(`myWorks.section.${work.section}`)}
        />
        {work.director && (
          <MetaRow label={t("admin.contentReview.director")} value={work.director} />
        )}
        <MetaRow label={t("admin.contentReview.workDescription")} value={work.description ?? "—"} />
        <p className="text-sm text-white/90">
          <span className="text-white/70">{t("admin.contentReview.proposedAspectRatio")}: </span>
          {work.approvedAspectRatio ?? work.proposedAspectRatio
            ? t(aspectRatioMessageKey(work.approvedAspectRatio ?? work.proposedAspectRatio!))
            : "—"}
        </p>
        {(work.approvedCategory || work.proposedCategory) && (
          <MetaRow
            label={t("admin.contentReview.proposedCategory")}
            value={work.approvedCategory ?? work.proposedCategory ?? "—"}
          />
        )}
        {((work.approvedTags ?? work.proposedTags)?.length ?? 0) > 0 && (
          <MetaRow
            label={t("admin.contentReview.proposedTags")}
            value={(work.approvedTags ?? work.proposedTags)!.join(", ")}
          />
        )}
      </div>

      {row.isRevision && row.livePromo ? (
        <div className="grid gap-4 lg:grid-cols-2 mb-4">
          <PromoMetaBlock
            heading={t("admin.contentReview.livePromo")}
            title={row.livePromo.title}
            description={row.livePromo.description}
            clipStartSec={row.livePromo.clipStartSec}
            clipEndSec={row.livePromo.clipEndSec}
            t={t}
          />
          <PromoMetaBlock
            heading={t("admin.contentReview.pendingPromo")}
            title={promo.title}
            description={promo.description}
            clipStartSec={promo.clipStartSec}
            clipEndSec={promo.clipEndSec}
            streamStatus={promo.streamStatus}
            t={t}
          />
        </div>
      ) : (
        <div className="mb-4">
          <PromoMetaBlock
            title={promo.title}
            description={promo.description}
            clipStartSec={promo.clipStartSec}
            clipEndSec={promo.clipEndSec}
            streamStatus={promo.streamStatus}
            t={t}
          />
        </div>
      )}

      {row.isRevision && row.livePromo?.playbackUrl && (
        <div className="mb-3 max-w-3xl">
          <p className="text-xs text-xiio-muted mb-2">{t("admin.contentReview.livePromoVideo")}</p>
          <PlaybackVideo src={row.livePromo.playbackUrl} maxHeightClass="max-h-[50vh]" />
        </div>
      )}

      {promo.playbackUrl && (
        <div className="mb-4 max-w-3xl">
          <p className="text-xs text-xiio-muted mb-2">
            {row.isRevision
              ? t("admin.contentReview.pendingPromoVideo")
              : t("admin.contentReview.promoVideo")}
          </p>
          <PlaybackVideo src={promo.playbackUrl} maxHeightClass="max-h-[60vh]" />
        </div>
      )}

      {!promo.playbackUrl && promo.streamStatus && promo.streamStatus !== "ready" && (
        <p className="text-sm text-amber-300/90 mb-4">
          {t("admin.contentReview.promoNotReady", {
            status: t(`myWorks.stream.${promo.streamStatus}`),
          })}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy || rejectOpen || promo.streamStatus !== "ready"}
          onClick={onApprove}
          className="px-3 py-1.5 text-xs rounded-lg bg-emerald-600/80 text-white disabled:opacity-40"
        >
          {t("admin.contentReview.approve")}
        </button>
        {!rejectOpen ? (
          <button
            type="button"
            disabled={busy}
            onClick={onRejectOpen}
            className="px-3 py-1.5 text-xs rounded-lg border border-red-500/40 text-red-400 hover:bg-red-500/10 disabled:opacity-40"
          >
            {t("admin.contentReview.reject")}
          </button>
        ) : (
          <>
            <button
              type="button"
              disabled={busy || !canPromoReject}
              onClick={onRejectConfirm}
              className="px-3 py-1.5 text-xs rounded-lg bg-red-600/80 text-white disabled:opacity-40"
            >
              {t("admin.contentReview.rejectConfirm")}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={onRejectCancel}
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
          rejectReason={rejectReason}
          onCodeChange={() => {}}
          onReasonChange={onRejectReasonChange}
        />
      )}
    </li>
  );
}
