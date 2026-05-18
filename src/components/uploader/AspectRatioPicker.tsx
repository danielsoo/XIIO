"use client";

import { useTranslations } from "@/context/LocaleContext";
import { aspectRatioMessageKey, aspectRatioNumeric } from "@/lib/works/aspect-ratio";
import { WORK_ASPECT_RATIOS, type VideoAspectRatio } from "@/types/work";

type Props = {
  value: VideoAspectRatio;
  onChange: (value: VideoAspectRatio) => void;
  disabled?: boolean;
};

export default function AspectRatioPicker({ value, onChange, disabled }: Props) {
  const { t } = useTranslations();

  return (
    <div className="space-y-2">
      <p className="text-xs text-xiio-muted">{t("uploader.uploadAspectRatioHint")}</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {WORK_ASPECT_RATIOS.map((id) => {
          const selected = value === id;
          const numeric = aspectRatioNumeric(id);
          const previewH = 28;
          const previewW = Math.min(56, Math.round(previewH * numeric));

          return (
            <button
              key={id}
              type="button"
              disabled={disabled}
              onClick={() => onChange(id)}
              className={`flex flex-col items-center gap-2 rounded-xl border px-3 py-3 transition disabled:opacity-40 ${
                selected
                  ? "border-xiio-accent bg-xiio-accent/15 text-white"
                  : "border-white/10 bg-white/5 text-xiio-muted hover:border-white/25 hover:text-white"
              }`}
            >
              <div
                className="rounded bg-white/20 border border-white/20 shrink-0"
                style={{ width: previewW, height: previewH }}
                aria-hidden
              />
              <span className="text-sm font-medium">{t(aspectRatioMessageKey(id))}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
