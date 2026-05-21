"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/context/LocaleContext";
import { useMyWorks } from "@/hooks/useMyWorks";
import { watchHref } from "@/lib/works/catalog-ui";
import AccountActivityCard from "@/components/account/AccountActivityCard";
import AccountEmptyState from "@/components/account/AccountEmptyState";

export default function AccountUploadsList() {
  const { user } = useAuth();
  const { t } = useTranslations();
  const { works, loading, error } = useMyWorks();

  if (loading) {
    return <p className="text-sm text-xiio-muted text-center py-8">{t("common.loading")}</p>;
  }

  if (error) {
    return <p className="text-sm text-red-400">{error}</p>;
  }

  if (works.length === 0) {
    return (
      <AccountEmptyState
        message={t("accountProfile.uploadsEmpty")}
        ctaLabel={t("accountProfile.emptyUploadCta")}
        ctaHref="/uploader/upload"
      />
    );
  }

  return (
    <div>
      <ul className="space-y-2 mb-4">
        {works.map((work) => (
          <AccountActivityCard
            key={work.id}
            title={work.title}
            section={work.section}
            meta={`${t(`myWorks.section.${work.section}`)} · ${t(`myWorks.status.${work.platformStatus}`)}`}
            href={user ? watchHref(user.uid, work.id) : "#"}
            watchLabel={t("accountProfile.watchLink")}
            watchDisabled={work.platformStatus !== "published"}
          />
        ))}
      </ul>
      <Link
        href="/uploader/works"
        className="inline-flex items-center justify-center w-full sm:w-auto px-4 py-2.5 rounded-lg text-sm font-medium border border-white/20 text-white hover:bg-white/5 transition"
      >
        {t("accountProfile.manageUploads")}
      </Link>
    </div>
  );
}
