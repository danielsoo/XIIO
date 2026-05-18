"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/context/LocaleContext";
import { formatAdminTimestamp } from "@/lib/admin/format-timestamp";
import type { AdminUserDetail } from "@/types/admin";
import { AdminWorkLink } from "@/components/admin/AdminEntityLinks";

type Props = { uid: string };

export default function AdminUserProfile({ uid }: Props) {
  const { user } = useAuth();
  const { t, locale } = useTranslations();
  const [data, setData] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setErr(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/admin/users/${uid}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = (await res.json().catch(() => ({}))) as AdminUserDetail & { message?: string };
      if (!res.ok) {
        setErr(body.message ?? `HTTP ${res.status}`);
        setData(null);
        return;
      }
      setData(body);
    } catch {
      setErr(t("admin.userProfile.loadError"));
    } finally {
      setLoading(false);
    }
  }, [user, uid, t]);

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
        <p className="text-red-400 text-sm mb-4">{err ?? t("admin.userProfile.notFound")}</p>
        <Link href="/admin/content" className="text-sm text-xiio-accent hover:underline">
          {t("admin.userProfile.backToContent")}
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link
        href="/admin/content"
        className="text-sm text-xiio-muted hover:text-xiio-accent transition mb-6 inline-block"
      >
        {t("admin.userProfile.backToContent")}
      </Link>

      <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">{data.displayName || data.uid}</h1>
      <p className="text-xiio-muted text-sm mb-8">{data.email ?? data.uid}</p>

      <div className="grid gap-6 md:grid-cols-2 mb-10">
        <section className="rounded-2xl border border-white/10 bg-xiio-surface p-5 space-y-3 text-sm">
          <h2 className="text-white font-semibold mb-2">{t("admin.userProfile.accountSection")}</h2>
          <Row label={t("admin.userProfile.joinedAt")} value={formatAdminTimestamp(data.createdAt, loc)} />
          <Row label={t("admin.userProfile.visitCount")} value={String(data.visitCount)} />
          <Row
            label={t("admin.userProfile.lastVisit")}
            value={formatAdminTimestamp(data.lastVisitAt, loc)}
          />
          <Row label={t("admin.userProfile.purpose")} value={t(`admin.userProfile.purpose.${data.platformPurpose}`)} />
          <Row label={t("admin.userProfile.role")} value={data.role} />
          <Row
            label={t("admin.userProfile.deposit")}
            value={
              data.depositVerified
                ? t("admin.userProfile.depositYes")
                : t("admin.userProfile.depositNo")
            }
          />
        </section>

        <section className="rounded-2xl border border-white/10 bg-xiio-surface p-5 space-y-3 text-sm">
          <h2 className="text-white font-semibold mb-2">{t("admin.userProfile.profileSection")}</h2>
          <Row label={t("admin.userProfile.age")} value={String(data.age)} />
          <Row
            label={t("admin.userProfile.student")}
            value={data.isStudent ? t("admin.userProfile.yes") : t("admin.userProfile.no")}
          />
          {data.isStudent && data.schoolName && (
            <Row label={t("admin.userProfile.school")} value={data.schoolName} />
          )}
          <Row
            label={t("admin.userProfile.emailVerified")}
            value={data.emailVerified ? t("admin.userProfile.yes") : t("admin.userProfile.no")}
          />
        </section>
      </div>

      <section>
        <h2 className="text-lg font-semibold text-white mb-4">
          {t("admin.userProfile.worksTitle")} ({data.works.length})
        </h2>
        {data.works.length === 0 ? (
          <p className="text-xiio-muted text-sm">{t("admin.userProfile.worksEmpty")}</p>
        ) : (
          <ul className="space-y-2">
            {data.works.map((w) => (
              <li
                key={w.id}
                className="rounded-xl border border-white/10 bg-xiio-surface px-4 py-3 flex flex-wrap items-center justify-between gap-2"
              >
                <div>
                  <p className="text-white font-medium">{w.title}</p>
                  <p className="text-xs text-xiio-muted mt-0.5">
                    {t(`myWorks.section.${w.section}`)} · {t(`myWorks.status.${w.platformStatus}`)} ·{" "}
                    {t(`myWorks.stream.${w.streamStatus}`)}
                    {(w.approvedCategory ?? w.proposedCategory) &&
                      ` · ${w.approvedCategory ?? w.proposedCategory}`}
                  </p>
                </div>
                <AdminWorkLink ownerUid={data.uid} workId={w.id} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <p className="flex flex-wrap gap-x-2">
      <span className="text-xiio-muted shrink-0">{label}:</span>
      <span className="text-white">{value}</span>
    </p>
  );
}
