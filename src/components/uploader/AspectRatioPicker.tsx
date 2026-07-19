"use client";

import { useTranslations } from "@/context/LocaleContext";
import { aspectRatioMessageKey, aspectRatioNumeric } from "@/lib/works/aspect-ratio";
import { WORK_ASPECT_RATIOS, type VideoAspectRatio } from "@/types/work";

type Props = {
  value: VideoAspectRatio;
  onChange: (value: VideoAspectRatio) => void;
  disabled?: boolean;
  showHint?: boolean;
};

export default function AspectRatioPicker({ value, onChange, disabled, showHint = true }: Props) {
  const { t } = useTranslations();

  return (
    <div className="space-y-2">
      {showHint ? (
        <p className="text-xs text-xiio-muted">{t("uploader.uploadAspectRatioHint")}</p>
      ) : null}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
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
              className={`flex min-h-[88px] flex-col items-center justify-center gap-2 rounded-xl border px-3 py-3 transition disabled:opacity-40 ${
                selected
                  ? "border-xiio-accent/80 bg-xiio-accent/10 text-white"
                  : "border-white/[0.09] bg-white/[0.025] text-white/45 hover:border-white/20 hover:bg-white/[0.045] hover:text-white/75"
              }`}
            >
              <div
                className="rounded bg-white/20 border border-white/20 shrink-0"
                style={{ width: previewW, height: previewH }}
                aria-hidden
              />
              <span className="text-[12px] font-medium">{t(aspectRatioMessageKey(id))}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
