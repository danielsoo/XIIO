"use client";

import type { RefObject } from "react";
import { useTranslations } from "@/context/LocaleContext";
import type { UploadPhase } from "@/lib/works/upload-progress";

type Props = {
  footerRef?: RefObject<HTMLDivElement | null>;
  busy: boolean;
  uploadComplete?: boolean;
  uploadPercent: number;
  uploadPhase: UploadPhase | null;
  uploadError: string | null;
  stepIndex: number;
  isLastStep: boolean;
  onBack: () => void;
  onPrimary: () => void;
};

export default function UploaderSubmitFooter({
  footerRef,
  busy,
  uploadComplete = false,
  uploadPercent,
  uploadPhase,
  uploadError,
  stepIndex,
  isLastStep,
  onBack,
  onPrimary,
}: Props) {
  const { t } = useTranslations();

  const phaseLabel = uploadPhase != null ? t(`uploader.uploadPhase.${uploadPhase}`) : null;
  const showProgress = busy && !uploadComplete;

  return (
    <div
      ref={footerRef}
      className="sticky bottom-0 z-20 -mx-1 px-1 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-xiio-bg/95 backdrop-blur-md border-t border-white/10"
    >
      <div className="rounded-2xl border border-white/10 bg-xiio-surface p-4 md:p-6 space-y-4 shadow-lg shadow-black/30">
        {uploadError ? (
          <div
            role="alert"
            className="rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-red-400 text-sm whitespace-pre-wrap break-words"
          >
            {uploadError}
          </div>
        ) : null}

        {uploadComplete ? (
          <div className="space-y-2" role="status">
            <p className="text-sm text-emerald-300/95 leading-relaxed">{t("uploader.uploadSuccess")}</p>
            <p className="text-xs text-xiio-muted">{t("uploader.uploadRedirecting")}</p>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full w-full bg-xiio-accent animate-pulse" />
            </div>
          </div>
        ) : null}

        {showProgress ? (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-xiio-muted">
              <span className="text-white/90 truncate pr-2">{phaseLabel}</span>
              <span className="tabular-nums shrink-0">
                {t("uploader.uploadProgress", { percent: uploadPercent })}
              </span>
            </div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-xiio-accent transition-all duration-300"
                style={{ width: `${uploadPercent}%` }}
              />
            </div>
            <p className="text-[11px] text-amber-200/90 leading-relaxed" role="status">
              {t("uploader.uploadLeaveWarning")}
            </p>
          </div>
        ) : null}

        <div className="flex gap-3">
          {stepIndex > 0 ? (
            <button
              type="button"
              onClick={onBack}
              disabled={busy || uploadComplete}
              className="flex-1 py-3 rounded-xl border border-white/20 text-white hover:bg-white/5 disabled:opacity-40 transition font-medium"
            >
              {t("common.previous")}
            </button>
          ) : null}
          <button
            type="button"
            onClick={onPrimary}
            disabled={busy || uploadComplete}
            className={`py-3 rounded-xl bg-xiio-accent hover:bg-xiio-accent-hover disabled:opacity-40 text-white font-semibold transition ${
              stepIndex === 0 ? "w-full" : "flex-1"
            }`}
          >
            {uploadComplete
              ? t("uploader.uploadRedirecting")
              : busy
                ? t("uploader.uploadProgress", { percent: uploadPercent })
                : isLastStep
                  ? t("uploader.uploadSubmitReview")
                  : t("common.next")}
          </button>
        </div>
      </div>
    </div>
  );
}
