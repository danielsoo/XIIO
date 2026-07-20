"use client";

import AppPageShell from "@/components/layout/AppPageShell";
import { useTranslations } from "@/context/LocaleContext";

export default function UploaderPageLoading() {
  const { t } = useTranslations();

  return (
    <AppPageShell
      fitViewport
      className="!p-0"
      contentClassName="flex h-full items-center justify-center"
    >
      <p className="text-sm text-xiio-muted" role="status" aria-live="polite">
        {t("common.loading")}
      </p>
    </AppPageShell>
  );
}
