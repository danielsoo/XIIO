"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { AdminEntityLinks } from "@/components/admin/AdminEntityLinks";
import ModerationFlagsPanel from "@/components/admin/ModerationFlagsPanel";
import type { ContentModeration } from "@/types/moderation";
import PlaybackVideo from "@/components/PlaybackVideo";
import RejectReasonFields, { canSubmitReject } from "@/components/admin/RejectReasonFields";
import { useTranslations } from "@/context/LocaleContext";
import { resolveDisplayTitle } from "@/lib/works/display-title";
import { isLongDescription } from "@/lib/works/description";
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
    durationSec?: number;
    contentModeration?: ContentModeration;
    pendingRevision?: { contentModeration?: ContentModeration };
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

type TranslateFn = (key: string, params?: Record<string, string | number>) => string;

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <p className="text-sm">
      <span className="text-white/70">{label}: </span>
      <span className="text-white/90 whitespace-pre-wrap break-words">{value || "—"}</span>
    </p>
  );
}

function DescriptionMetaRow({
  label,
  value,
  clamp,
  t,
}: {
  label: string;
  value: string;
  clamp: boolean;
  t: TranslateFn;
}) {
  const [expanded, setExpanded] = useState(false);
  const display = value || "—";

  if (!clamp) {
    return <MetaRow label={label} value={display} />;
  }

  const long = isLongDescription(display);
  const collapsed = !expanded;
  const boxClass = collapsed ? "h-[7.25rem] flex flex-col" : "min-h-[7.25rem] flex flex-col";

  return (
    <div className={boxClass}>
      <span className="shrink-0 text-sm text-white/70">{label}:</span>
      <p
        className={`min-h-0 flex-1 overflow-hidden text-sm text-white/90 whitespace-pre-wrap break-words ${
          collapsed && long ? "line-clamp-4" : ""
        }`}
      >
        {display}
      </p>
      <div className="mt-1 h-5 shrink-0">
        {long ? (
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="text-xs text-xiio-accent hover:underline"
          >
            {expanded
              ? t("admin.contentReview.descriptionShowLess")
              : t("admin.contentReview.descriptionShowMore")}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function PromoMetaFields({
  title,
  description,
  clipStartSec,
  clipEndSec,
  durationSec,
  streamStatus,
  clampDescription = false,
  t,
}: {
  title?: string;
  description?: string;
  clipStartSec: number;
  clipEndSec: number;
  durationSec?: number;
  streamStatus?: StreamStatus;
  clampDescription?: boolean;
  t: TranslateFn;
}) {
  const legacyClip = clipStartSec > 0.5;
  const durationLabel = legacyClip
    ? t("admin.contentReview.promoClipRange", {
        start: clipStartSec.toFixed(1),
        end: clipEndSec.toFixed(1),
        sec: (clipEndSec - clipStartSec).toFixed(1),
      })
    : t("promoEditor.videoDuration", {
        sec: (durationSec ?? clipEndSec - clipStartSec).toFixed(1),
      });
  return (
    <div className="space-y-2">
      <MetaRow label={t("admin.contentReview.promoTitle")} value={title ?? "—"} />
      <DescriptionMetaRow
        label={t("admin.contentReview.promoDescription")}
        value={description ?? "—"}
        clamp={clampDescription}
        t={t}
      />
      <p className="text-sm text-white/90">
        <span className="text-white/70">
          {legacyClip ? t("admin.contentReview.promoClip") : t("admin.contentReview.promoDuration")}:{" "}
        </span>
        {durationLabel}
      </p>
      {streamStatus && (
        <p className="text-xs text-xiio-muted">
          {t("admin.contentReview.streamStatus")}: {t(`myWorks.stream.${streamStatus}`)}
        </p>
      )}
    </div>
  );
}

function PromoMetaBlock({
  heading,
  title,
  description,
  clipStartSec,
  clipEndSec,
  durationSec,
  streamStatus,
  t,
}: {
  heading?: string;
  title?: string;
  description?: string;
  clipStartSec: number;
  clipEndSec: number;
  durationSec?: number;
  streamStatus?: StreamStatus;
  t: TranslateFn;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-4 space-y-2">
      {heading && (
        <p className="text-xs font-semibold text-xiio-accent uppercase tracking-wide">{heading}</p>
      )}
      <PromoMetaFields
        title={title}
        description={description}
        clipStartSec={clipStartSec}
        clipEndSec={clipEndSec}
        durationSec={durationSec}
        streamStatus={streamStatus}
        t={t}
      />
    </div>
  );
}

type CompareVariant = "live" | "pending";

function CompareColumn({
  variant,
  label,
  hint,
  className = "",
  videoLabel,
  children,
}: {
  variant: CompareVariant;
  label: string;
  hint: string;
  className?: string;
  videoLabel: string;
  children: ReactNode;
}) {
  const isLive = variant === "live";
  return (
    <section
      className={`flex h-full flex-col overflow-hidden rounded-xl border ${
        isLive
          ? "border-white/15 bg-white/[0.02]"
          : "border-sky-500/40 bg-sky-500/[0.06]"
      } ${className}`}
      aria-label={label}
    >
      <div
        className={`border-b px-4 py-3 ${
          isLive ? "border-white/10 bg-zinc-800/70" : "border-sky-500/25 bg-sky-950/50"
        }`}
      >
        <span
          className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${
            isLive
              ? "bg-zinc-600/50 text-zinc-100"
              : "bg-sky-500/35 text-sky-100 ring-1 ring-sky-400/30"
          }`}
        >
          {label}
        </span>
        <p className="mt-2 text-xs text-white/55">{hint}</p>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4" aria-label={videoLabel}>
        {children}
      </div>
    </section>
  );
}

function RevisionCompareSection({
  livePromo,
  promo,
  untitledLabel,
  t,
}: {
  livePromo: PromoLiveSnapshot;
  promo: PromoReviewItem["promo"];
  untitledLabel: string;
  t: TranslateFn;
}) {
  const pendingTitle = resolveDisplayTitle(untitledLabel, promo?.title);
  const liveTitle = resolveDisplayTitle(untitledLabel, livePromo?.title);
  return (
    <div className="mb-4 grid grid-cols-1 items-stretch gap-4 lg:grid-cols-2">
      <CompareColumn
        variant="pending"
        label={t("admin.contentReview.pendingPromo")}
        hint={t("admin.contentReview.comparePendingHint")}
        videoLabel={t("admin.contentReview.pendingPromoVideo")}
        className="order-first h-full lg:order-2"
      >
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          <PromoMetaFields
            title={pendingTitle}
            description={promo?.description}
            clipStartSec={promo?.clipStartSec ?? 0}
            clipEndSec={promo?.clipEndSec ?? 0}
            durationSec={promo?.durationSec}
            streamStatus={promo?.streamStatus}
            clampDescription
            t={t}
          />
          <div className="mt-auto">
            {promo.playbackUrl ? (
              <PlaybackVideo src={promo.playbackUrl} maxHeightClass="max-h-[42vh]" />
            ) : promo.streamStatus && promo.streamStatus !== "ready" ? (
              <p className="text-sm text-amber-300/90">
                {t("admin.contentReview.promoNotReady", {
                  status: t(`myWorks.stream.${promo.streamStatus}`),
                })}
              </p>
            ) : null}
          </div>
        </div>
      </CompareColumn>

      <CompareColumn
        variant="live"
        label={t("admin.contentReview.livePromo")}
        hint={t("admin.contentReview.compareLiveHint")}
        videoLabel={t("admin.contentReview.livePromoVideo")}
        className="order-2 h-full lg:order-1"
      >
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          <PromoMetaFields
            title={liveTitle}
            description={livePromo.description}
            clipStartSec={livePromo.clipStartSec}
            clipEndSec={livePromo.clipEndSec}
            clampDescription
            t={t}
          />
          <div className="mt-auto">
            {livePromo.playbackUrl ? (
              <PlaybackVideo src={livePromo.playbackUrl} maxHeightClass="max-h-[42vh]" />
            ) : (
              <p className="text-sm text-white/50">{t("admin.contentReview.noLiveVideo")}</p>
            )}
          </div>
        </div>
      </CompareColumn>
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
  const untitledLabel = t("common.untitled");
  const canPromoReject = canSubmitReject("", rejectReason, false);
  const work = row.work;
  const promo = row.promo;
  const isRevisionCompare = row.isRevision && row.livePromo;

  if (!work || !promo) {
    return null;
  }

  const promoDisplayTitle = resolveDisplayTitle(
    untitledLabel,
    promo.title,
    work.title
  );
  const workDisplayTitle = resolveDisplayTitle(untitledLabel, work.title);

  return (
    <li className="rounded-2xl border border-white/10 bg-xiio-surface p-5">
      <h2 className="text-lg font-semibold text-white flex flex-wrap items-center gap-2">
        <Link
          href={`/admin/content/works/${row.ownerUid}/${row.workId}`}
          className="hover:text-xiio-accent transition"
        >
          {promoDisplayTitle}
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
        <MetaRow label={t("admin.contentReview.workTitle")} value={workDisplayTitle} />
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

      {isRevisionCompare ? (
        <RevisionCompareSection
          livePromo={row.livePromo!}
          promo={promo}
          untitledLabel={untitledLabel}
          t={t}
        />
      ) : (
        <>
          <div className="mb-4">
            <PromoMetaBlock
              title={promoDisplayTitle}
              description={promo.description}
              clipStartSec={promo.clipStartSec}
              clipEndSec={promo.clipEndSec}
              durationSec={promo.durationSec}
              streamStatus={promo.streamStatus}
              t={t}
            />
          </div>

          {promo.playbackUrl && (
            <div className="mb-4 max-w-3xl">
              <p className="text-xs text-xiio-muted mb-2">{t("admin.contentReview.promoVideo")}</p>
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
        </>
      )}

      <ModerationFlagsPanel
        moderation={
          row.isRevision
            ? row.promo.pendingRevision?.contentModeration
            : row.promo.contentModeration
        }
        className="mb-4"
      />

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
