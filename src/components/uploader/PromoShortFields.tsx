"use client";

import { useTranslations } from "@/context/LocaleContext";
import { uploaderInputClass } from "@/components/uploader/uploaderFormStyles";

type Props = {
  duration: number;
  clipStart: number;
  clipEnd: number;
  onClipStartChange: (v: number) => void;
  onClipEndChange: (v: number) => void;
  title: string;
  onTitleChange: (v: string) => void;
  description: string;
  onDescriptionChange: (v: string) => void;
  disabled?: boolean;
  /** 업로드 폼에서 필수 섹션 헤더 표시 */
  showRequiredHeader?: boolean;
  /** 클립 슬라이더 숨김 (인코딩 대기 등) */
  hideClipSliders?: boolean;
};

export default function PromoShortFields({
  duration,
  clipStart,
  clipEnd,
  onClipStartChange,
  onClipEndChange,
  title,
  onTitleChange,
  description,
  onDescriptionChange,
  disabled = false,
  showRequiredHeader = false,
  hideClipSliders = false,
}: Props) {
  const { t } = useTranslations();
  const safeDuration = Math.max(duration, 3);
  const maxStart = Math.max(0, safeDuration - 3);

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

      {!hideClipSliders && safeDuration > 0 && (
        <>
          <p className="text-xs text-xiio-muted">{t("promoEditor.clipHint")}</p>
          <div>
            <label className="block text-xs text-xiio-muted mb-1">
              {t("promoEditor.clipStart")} ({clipStart.toFixed(1)}s)
            </label>
            <input
              type="range"
              min={0}
              max={maxStart}
              step={0.5}
              value={clipStart}
              disabled={disabled}
              onChange={(e) => {
                const v = Number(e.target.value);
                onClipStartChange(v);
                if (clipEnd <= v + 3) {
                  onClipEndChange(Math.min(v + 30, safeDuration));
                }
              }}
              className="w-full disabled:opacity-40"
            />
          </div>
          <div>
            <label className="block text-xs text-xiio-muted mb-1">
              {t("promoEditor.clipEnd")} ({clipEnd.toFixed(1)}s) —{" "}
              {t("promoEditor.clipDuration", { sec: (clipEnd - clipStart).toFixed(1) })}
            </label>
            <input
              type="range"
              min={clipStart + 3}
              max={Math.min(safeDuration, clipStart + 120)}
              step={0.5}
              value={clipEnd}
              disabled={disabled}
              onChange={(e) => onClipEndChange(Number(e.target.value))}
              className="w-full disabled:opacity-40"
            />
          </div>
        </>
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
