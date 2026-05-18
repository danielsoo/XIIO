"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/context/LocaleContext";
import { formatAdminTimestamp } from "@/lib/admin/format-timestamp";
import { AdminOwnerLink } from "@/components/admin/AdminEntityLinks";
import type { AdminWorkDetail } from "@/types/admin";

type Props = { ownerUid: string; workId: string };

export default function AdminWorkDetail({ ownerUid, workId }: Props) {
  const { user } = useAuth();
  const { t, locale } = useTranslations();
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
      const body = (await res.json().catch(() => ({}))) as AdminWorkDetail & { message?: string };
      if (!res.ok) {
        setErr(body.message ?? `HTTP ${res.status}`);
        setData(null);
        return;
      }
      setData(body);
    } catch {
      setErr(t("admin.workDetail.loadError"));
    } finally {
      setLoading(false);
    }
  }, [user, ownerUid, workId, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const loc = locale === "en" ? "en-US" : "ko-KR";

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
            value={formatAdminTimestamp(work.createdAt, loc)}
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

      <section className="mb-8 w-full">
        <h2 className="text-white font-semibold text-base mb-3">{t("admin.workDetail.fullVideo")}</h2>
        {playbackUrl ? (
          <div className="w-full rounded-xl overflow-hidden bg-black border border-white/10 aspect-video">
            <video
              src={playbackUrl}
              controls
              className="w-full h-full object-contain"
              playsInline
            />
          </div>
        ) : (
          <p className="text-xiio-muted text-sm rounded-xl border border-dashed border-white/15 px-4 py-8 text-center">
            {t("admin.workDetail.noPlayback")}
          </p>
        )}
      </section>

      {promo && (
        <section className="w-full">
          <h2 className="text-white font-semibold text-base mb-2">{t("admin.workDetail.promoSection")}</h2>
          <p className="text-xs text-xiio-muted mb-3">
            {promo.title ?? work.title} · {t(`myWorks.promoStatus.${promo.platformStatus}`)} ·{" "}
            {promo.clipStartSec}s–{promo.clipEndSec}s
          </p>
          {promo.deletionRequest && (
            <p className="text-orange-400 text-sm font-medium mb-3">
              {t("admin.workDetail.deletionReason")}: {promo.deletionRequest.reason}
            </p>
          )}
          {promo.playbackUrl ? (
            <div className="w-full rounded-xl overflow-hidden bg-black border border-white/10 aspect-video">
              <video
                src={promo.playbackUrl}
                controls
                className="w-full h-full object-contain"
                playsInline
              />
            </div>
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
