"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/context/LocaleContext";
import { aspectRatioMessageKey } from "@/lib/works/aspect-ratio";
import { AdminOwnerLink } from "@/components/admin/AdminEntityLinks";
import AdminReviewVideo from "@/components/admin/AdminReviewVideo";
import CatalogThumbnailReview from "@/components/admin/CatalogThumbnailReview";
import type { AdminWorkDetail } from "@/types/admin";
import { formatApiError, formatClientError, readResponseJson } from "@/lib/clientErrors";

type Props = { ownerUid: string; workId: string };

export default function AdminWorkDetail({ ownerUid, workId }: Props) {
  const { user } = useAuth();
  const { t, formatDateTime } = useTranslations();
  const [data, setData] = useState<AdminWorkDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setErr(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/admin/works/${ownerUid}/${workId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const { data: body, raw } = await readResponseJson<AdminWorkDetail & { message?: string; error?: string }>(
        res
      );
      if (!res.ok) {
        setErr(formatApiError(t, res.status, { ...body, message: body.message ?? raw.slice(0, 500) }));
        setData(null);
        return;
      }
      setData(body);
    } catch (e) {
      setErr(formatClientError(t, e, { titleKey: "admin.workDetail.loadError" }));
    } finally {
      setLoading(false);
    }
  }, [user, ownerUid, workId, t]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <p className="text-xiio-muted">{t("admin.loading")}</p>;
  }

  if (err || !data) {
    return (
      <div>
        <p className="text-red-400 text-sm mb-4">{err ?? t("admin.workDetail.notFound")}</p>
        <Link href="/admin/content" className="text-sm text-xiio-accent hover:underline">
          {t("admin.workDetail.backToContent")}
        </Link>
      </div>
    );
  }

  const { work, owner, playbackUrl, promo } = data;

  return (
    <div>
      <Link
        href="/admin/content"
        className="text-sm text-xiio-muted hover:text-xiio-accent transition mb-6 inline-block"
      >
        {t("admin.workDetail.backToContent")}
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">{work.title}</h1>
          <p className="text-xiio-muted text-sm mt-1">
            {t(`myWorks.section.${work.section}`)} · {t(`myWorks.status.${work.platformStatus}`)} ·{" "}
            {t(`myWorks.stream.${work.streamStatus}`)}
          </p>
        </div>
        <AdminOwnerLink
          ownerUid={owner.uid}
          ownerLabel={owner.displayName || owner.email || owner.uid}
          className="text-sm"
        />
      </div>

      <section className="rounded-2xl border border-white/10 bg-xiio-surface p-5 md:p-6 mb-6 space-y-3 text-sm max-w-4xl">
        <h2 className="text-white font-semibold text-base">{t("admin.workDetail.metaSection")}</h2>
        <dl className="grid gap-3 sm:grid-cols-2">
          {work.director && (
            <MetaRow label={t("admin.workDetail.director")} value={work.director} />
          )}
          <MetaRow
            label={t("admin.workDetail.proposedCategory")}
            value={work.proposedCategory || "—"}
          />
          <MetaRow
            label={t("admin.workDetail.approvedCategory")}
            value={work.approvedCategory || "—"}
          />
          <MetaRow
            label={t("admin.workDetail.tags")}
            value={
              (work.approvedTags ?? work.proposedTags ?? []).length > 0
                ? (work.approvedTags ?? work.proposedTags)!.join(", ")
                : "—"
            }
          />
          <MetaRow
            label={t("admin.workDetail.createdAt")}
            value={formatDateTime(work.createdAt)}
          />
          <MetaRow
            label={t("admin.workDetail.proposedAspectRatio")}
            value={
              work.proposedAspectRatio
                ? t(aspectRatioMessageKey(work.proposedAspectRatio))
                : "—"
            }
          />
          <MetaRow
            label={t("admin.workDetail.approvedAspectRatio")}
            value={
              work.approvedAspectRatio
                ? t(aspectRatioMessageKey(work.approvedAspectRatio))
                : "—"
            }
          />
        </dl>
        {work.description && (
          <p className="text-white/90 whitespace-pre-wrap pt-2 border-t border-white/10">
            {work.description}
          </p>
        )}
        {work.deletionRequest && (
          <p className="text-orange-400 font-medium pt-2 border-t border-white/10">
            {t("admin.workDetail.deletionReason")}: {work.deletionRequest.reason}
          </p>
        )}
        {work.rejectReason && (
          <p className="text-red-400 pt-2 border-t border-white/10">
            {work.rejectReasonCode && t(`myWorks.rejectReason.${work.rejectReasonCode}`)} —{" "}
            {work.rejectReason}
          </p>
        )}
      </section>

      <CatalogThumbnailReview url={data.catalogThumbnailUrl} className="mb-8" />

      <section className="mb-8 w-full">
        <h2 className="text-white font-semibold text-base mb-3">{t("admin.workDetail.fullVideo")}</h2>
        {playbackUrl ? (
          <AdminReviewVideo src={playbackUrl} />
        ) : (
          <p className="text-xiio-muted text-sm rounded-xl border border-dashed border-white/15 px-4 py-8 text-center">
            {t("admin.workDetail.noPlayback")}
          </p>
        )}
      </section>

      {data.auditLog && data.auditLog.length > 0 && (
        <section className="mb-8 rounded-2xl border border-white/10 bg-xiio-surface p-5">
          <h2 className="text-white font-semibold text-base mb-4">{t("admin.workDetail.auditTitle")}</h2>
          <ul className="space-y-3">
            {data.auditLog.map((entry) => (
              <li
                key={entry.id}
                className="text-sm border-b border-white/5 pb-3 last:border-0 last:pb-0"
              >
                <p className="text-xs text-white/50 mb-1">{formatDateTime(entry.at)}</p>
                <p className="text-violet-200/90">
                  {t(`admin.userActivity.audit.${entry.action}`, {
                    workTitle: entry.workTitle ?? work.title,
                  })}
                </p>
                {entry.note && (
                  <p className="text-xs text-white/50 mt-1">{entry.note}</p>
                )}
                {entry.actor && (
                  <p className="text-xs text-white/60 mt-1">
                    {t("admin.userActivity.actorLabel")}:{" "}
                    <Link
                      href={`/admin/users/${entry.actor.uid}`}
                      className="text-xiio-accent hover:underline"
                    >
                      {entry.actor.displayName}
                    </Link>
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {promo && (
        <section className="w-full">
          <h2 className="text-white font-semibold text-base mb-2">{t("admin.workDetail.promoSection")}</h2>
          <p className="text-xs text-xiio-muted mb-3">
            {promo.title ?? work.title} · {t(`myWorks.promoStatus.${promo.platformStatus}`)} ·{" "}
            {promo.durationSec != null
              ? t("promoEditor.videoDuration", { sec: promo.durationSec.toFixed(1) })
              : (promo.clipStartSec ?? 0) > 0.5
                ? `${promo.clipStartSec}s–${promo.clipEndSec}s`
                : t("promoEditor.videoDuration", {
                    sec: ((promo.clipEndSec ?? 0) - (promo.clipStartSec ?? 0)).toFixed(1),
                  })}
          </p>
          {promo.deletionRequest && (
            <p className="text-orange-400 text-sm font-medium mb-3">
              {t("admin.workDetail.deletionReason")}: {promo.deletionRequest.reason}
            </p>
          )}
          {promo.playbackUrl ? (
            <AdminReviewVideo src={promo.playbackUrl} />
          ) : (
            <p className="text-xiio-muted text-sm rounded-xl border border-dashed border-white/15 px-4 py-8 text-center">
              {t("admin.workDetail.noPlayback")}
            </p>
          )}
        </section>
      )}
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xiio-muted text-xs mb-0.5">{label}</dt>
      <dd className="text-white">{value}</dd>
    </div>
  );
}
