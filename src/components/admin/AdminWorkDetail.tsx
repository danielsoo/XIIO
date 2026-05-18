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

      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        <section className="rounded-2xl border border-white/10 bg-xiio-surface p-5 space-y-2 text-sm">
          <h2 className="text-white font-semibold mb-2">{t("admin.workDetail.metaSection")}</h2>
          {work.director && (
            <p>
              <span className="text-xiio-muted">{t("admin.workDetail.director")}: </span>
              <span className="text-white">{work.director}</span>
            </p>
          )}
          {work.description && (
            <p className="text-white/90 whitespace-pre-wrap">{work.description}</p>
          )}
          <p>
            <span className="text-xiio-muted">{t("admin.workDetail.proposedCategory")}: </span>
            <span className="text-white">{work.proposedCategory || "—"}</span>
          </p>
          <p>
            <span className="text-xiio-muted">{t("admin.workDetail.approvedCategory")}: </span>
            <span className="text-white">{work.approvedCategory || "—"}</span>
          </p>
          <p>
            <span className="text-xiio-muted">{t("admin.workDetail.tags")}: </span>
            <span className="text-white">
              {(work.approvedTags ?? work.proposedTags ?? []).length > 0
                ? (work.approvedTags ?? work.proposedTags)!.join(", ")
                : "—"}
            </span>
          </p>
          <p>
            <span className="text-xiio-muted">{t("admin.workDetail.createdAt")}: </span>
            <span className="text-white">{formatAdminTimestamp(work.createdAt, loc)}</span>
          </p>
          {work.deletionRequest && (
            <p className="text-orange-400">
              {t("admin.workDetail.deletionReason")}: {work.deletionRequest.reason}
            </p>
          )}
          {work.rejectReason && (
            <p className="text-red-400">
              {work.rejectReasonCode && t(`myWorks.rejectReason.${work.rejectReasonCode}`)} —{" "}
              {work.rejectReason}
            </p>
          )}
        </section>

        <section className="rounded-2xl border border-white/10 bg-xiio-surface p-5">
          <h2 className="text-white font-semibold mb-3">{t("admin.workDetail.fullVideo")}</h2>
          {playbackUrl ? (
            <video src={playbackUrl} controls className="w-full rounded-lg" playsInline />
          ) : (
            <p className="text-xiio-muted text-sm">{t("admin.workDetail.noPlayback")}</p>
          )}
        </section>
      </div>

      {promo && (
        <section className="rounded-2xl border border-white/10 bg-xiio-surface p-5">
          <h2 className="text-white font-semibold mb-2">{t("admin.workDetail.promoSection")}</h2>
          <p className="text-xs text-xiio-muted mb-3">
            {promo.title ?? work.title} · {t(`myWorks.promoStatus.${promo.platformStatus}`)} ·{" "}
            {promo.clipStartSec}s–{promo.clipEndSec}s
          </p>
          {promo.playbackUrl ? (
            <video src={promo.playbackUrl} controls className="w-full max-w-lg rounded-lg" playsInline />
          ) : (
            <p className="text-xiio-muted text-sm">{t("admin.workDetail.noPlayback")}</p>
          )}
          {promo.deletionRequest && (
            <p className="text-orange-400 text-sm mt-2">
              {t("admin.workDetail.deletionReason")}: {promo.deletionRequest.reason}
            </p>
          )}
        </section>
      )}
    </div>
  );
}
