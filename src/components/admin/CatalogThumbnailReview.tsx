"use client";

import { useTranslations } from "@/context/LocaleContext";

type Props = {
  url: string | null | undefined;
  className?: string;
};

export default function CatalogThumbnailReview({ url, className = "mb-3" }: Props) {
  const { t } = useTranslations();
  if (!url?.trim()) return null;

  return (
    <div className={className}>
      <p className="text-xs text-xiio-muted mb-2">{t("admin.contentReview.catalogThumbnail")}</p>
      <div className="max-w-xl rounded-xl overflow-hidden border border-white/10 bg-black/40">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt=""
          className="w-full h-auto object-cover max-h-[min(50vh,480px)]"
        />
      </div>
    </div>
  );
}
