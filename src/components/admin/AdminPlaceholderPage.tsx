"use client";

import Link from "next/link";
import { useTranslations } from "@/context/LocaleContext";

export default function AdminPlaceholderPage({
  titleKey,
  descriptionKey,
}: {
  titleKey: string;
  descriptionKey: string;
}) {
  const { t } = useTranslations();

  return (
    <div>
      <Link href="/admin" className="text-sm text-xiio-muted hover:text-xiio-accent transition mb-4 inline-block">
        {t("admin.placeholderBack")}
      </Link>
      <h1 className="text-2xl font-bold text-white mb-2">{t(titleKey)}</h1>
      <p className="text-xiio-muted text-sm">{t(descriptionKey)}</p>
      <p className="text-xiio-muted text-sm mt-4">{t("admin.placeholderComingSoon")}</p>
    </div>
  );
}
