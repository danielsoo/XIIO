"use client";

import { useTranslations } from "@/context/LocaleContext";
import { uploaderInputClass } from "@/components/uploader/uploaderFormStyles";

type Props = {
  title: string;
  onTitleChange: (v: string) => void;
  description: string;
  onDescriptionChange: (v: string) => void;
  disabled?: boolean;
  showRequiredHeader?: boolean;
};

export default function PromoShortFields({
  title,
  onTitleChange,
  description,
  onDescriptionChange,
  disabled = false,
  showRequiredHeader = false,
}: Props) {
  const { t } = useTranslations();

  return (
    <section className="space-y-4">
      {showRequiredHeader ? (
        <>
          <h2 className="text-sm font-semibold text-white">{t("uploader.uploadGroupPromoRequired")}</h2>
          <p className="text-xs text-xiio-muted -mt-2">{t("uploader.promoRequiredHint")}</p>
        </>
      ) : (
        <h2 className="text-sm font-semibold text-white">{t("promoEditor.promoFieldsGroup")}</h2>
      )}

      <div>
        <label className="block text-xs text-xiio-muted mb-1.5" htmlFor="promo-short-title">
          {t("promoEditor.promoTitle")} *
        </label>
        <input
          id="promo-short-title"
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          disabled={disabled}
          maxLength={200}
          className={`${uploaderInputClass} font-semibold`}
        />
      </div>
      <div>
        <label className="block text-xs text-xiio-muted mb-1.5" htmlFor="promo-short-description">
          {t("promoEditor.promoDescription")}
        </label>
        <textarea
          id="promo-short-description"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          disabled={disabled}
          rows={3}
          className={`${uploaderInputClass} resize-y min-h-[4.5rem]`}
        />
      </div>
    </section>
  );
}
