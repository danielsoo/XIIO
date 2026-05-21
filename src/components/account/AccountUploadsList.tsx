"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/context/LocaleContext";
import { useMyWorks } from "@/hooks/useMyWorks";
import { watchHref } from "@/lib/works/catalog-ui";

export default function AccountUploadsList() {
  const { user } = useAuth();
  const { t } = useTranslations();
  const { works, loading, error } = useMyWorks();

  if (loading) {
    return <p className="text-sm text-xiio-muted">{t("common.loading")}</p>;
  }

  if (error) {
    return <p className="text-sm text-red-400">{error}</p>;
  }

  if (works.length === 0) {
    return <p className="text-sm text-xiio-muted">{t("accountProfile.uploadsEmpty")}</p>;
  }

  return (
    <div>
      <ul className="space-y-2 mb-4">
        {works.map((work) => (
          <li
            key={work.id}
            className="rounded-xl border border-white/10 bg-xiio-bg/40 px-4 py-3 flex flex-wrap items-center justify-between gap-2"
          >
            <div className="min-w-0">
              <p className="text-white font-medium truncate">{work.title}</p>
              <p className="text-xs text-xiio-muted mt-0.5">
                {t(`myWorks.section.${work.section}`)} · {t(`myWorks.status.${work.platformStatus}`)}
              </p>
            </div>
            {work.platformStatus === "published" && user && (
              <Link
                href={watchHref(user.uid, work.id)}
                className="text-sm text-xiio-accent hover:underline shrink-0"
              >
                {t("accountProfile.watchLink")}
              </Link>
            )}
          </li>
        ))}
      </ul>
      <Link href="/uploader/works" className="text-sm text-xiio-accent hover:underline">
        {t("accountProfile.manageUploads")}
      </Link>
    </div>
  );
}
