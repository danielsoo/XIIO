"use client";

import type { RefObject } from "react";
import { useTranslations } from "@/context/LocaleContext";
import type { PromoTrimRange } from "@/lib/works/promo-clip";
import { PROMO_MAX_DURATION_SEC, PROMO_MIN_DURATION_SEC } from "@/lib/works/promo-video";

type Props = {
  durationSec: number;
  value: PromoTrimRange;
  onChange: (next: PromoTrimRange) => void;
  videoRef: RefObject<HTMLVideoElement | null>;
  disabled?: boolean;
  error?: string | null;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function roundTenth(value: number) {
  return Math.round(value * 10) / 10;
}

function formatTime(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${minutes}:${String(secs).padStart(2, "0")}`;
}

export default function PromoTrimControls({
  durationSec,
  value,
  onChange,
  videoRef,
  disabled = false,
  error = null,
}: Props) {
  const { t } = useTranslations();
  const selectionDuration = Math.max(0, value.endSec - value.startSec);

  const updateStart = (raw: number) => {
    const latestStart = Math.max(0, durationSec - PROMO_MIN_DURATION_SEC);
    const startSec = roundTenth(clamp(raw, 0, latestStart));
    const endSec = roundTenth(
      clamp(
        value.endSec,
        startSec + PROMO_MIN_DURATION_SEC,
        Math.min(durationSec, startSec + PROMO_MAX_DURATION_SEC)
      )
    );
    onChange({ startSec, endSec });
  };

  const updateEnd = (raw: number) => {
    const endSec = roundTenth(
      clamp(
        raw,
        value.startSec + PROMO_MIN_DURATION_SEC,
        Math.min(durationSec, value.startSec + PROMO_MAX_DURATION_SEC)
      )
    );
    onChange({ startSec: value.startSec, endSec });
  };

  const useCurrentTime = (target: "start" | "end") => {
    const current = videoRef.current?.currentTime ?? 0;
    if (target === "start") updateStart(current);
    else updateEnd(current);
  };

  const previewSelection = async () => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = value.startSec;
    const stopAtEnd = () => {
      if (video.currentTime >= value.endSec - 0.05) {
        video.pause();
        video.removeEventListener("timeupdate", stopAtEnd);
      }
    };
    video.addEventListener("timeupdate", stopAtEnd);
    try {
      await video.play();
    } catch {
      video.removeEventListener("timeupdate", stopAtEnd);
    }
  };

  return (
    <div
      className={`border-t px-4 py-4 md:px-5 ${
        error ? "border-red-400/45 bg-red-500/[0.055]" : "border-white/10 bg-[#111114]"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-white">{t("uploader.promoTrimTitle")}</h3>
            <span className="rounded-full border border-xiio-accent/35 bg-xiio-accent/10 px-2 py-0.5 text-[10px] font-semibold text-xiio-accent">
              {t("uploader.promoTrimRequiredBadge")}
            </span>
          </div>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-white/55">
            {t("uploader.promoTrimHint", { duration: formatTime(durationSec) })}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-[0.14em] text-white/35">
            {t("uploader.promoTrimSelected")}
          </p>
          <p className={`mt-0.5 text-base font-semibold ${selectionDuration > 120 ? "text-red-400" : "text-white"}`}>
            {formatTime(selectionDuration)} / 2:00
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <div>
          <div className="flex items-center justify-between gap-3">
            <label className="text-xs font-medium text-white/75" htmlFor="promo-trim-start">
              {t("uploader.promoTrimStart")}
            </label>
            <span className="font-mono text-xs text-white/70">{formatTime(value.startSec)}</span>
          </div>
          <input
            id="promo-trim-start"
            type="range"
            min={0}
            max={Math.max(0, durationSec - PROMO_MIN_DURATION_SEC)}
            step={0.1}
            value={value.startSec}
            onChange={(event) => updateStart(Number(event.target.value))}
            disabled={disabled}
            className="mt-3 w-full accent-[#3b82f6] disabled:opacity-40"
          />
          <button
            type="button"
            onClick={() => useCurrentTime("start")}
            disabled={disabled}
            className="mt-2 text-xs font-medium text-xiio-accent hover:underline disabled:opacity-40"
          >
            {t("uploader.promoTrimUseCurrentStart")}
          </button>
        </div>

        <div>
          <div className="flex items-center justify-between gap-3">
            <label className="text-xs font-medium text-white/75" htmlFor="promo-trim-end">
              {t("uploader.promoTrimEnd")}
            </label>
            <span className="font-mono text-xs text-white/70">{formatTime(value.endSec)}</span>
          </div>
          <input
            id="promo-trim-end"
            type="range"
            min={value.startSec + PROMO_MIN_DURATION_SEC}
            max={Math.min(durationSec, value.startSec + PROMO_MAX_DURATION_SEC)}
            step={0.1}
            value={value.endSec}
            onChange={(event) => updateEnd(Number(event.target.value))}
            disabled={disabled}
            className="mt-3 w-full accent-[#3b82f6] disabled:opacity-40"
          />
          <button
            type="button"
            onClick={() => useCurrentTime("end")}
            disabled={disabled}
            className="mt-2 text-xs font-medium text-xiio-accent hover:underline disabled:opacity-40"
          >
            {t("uploader.promoTrimUseCurrentEnd")}
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] pt-4">
        <p className="text-xs text-white/45">
          {t("uploader.promoTrimRangeSummary", {
            start: formatTime(value.startSec),
            end: formatTime(value.endSec),
          })}
        </p>
        <button
          type="button"
          onClick={() => void previewSelection()}
          disabled={disabled}
          className="rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-white transition hover:border-white/30 hover:bg-white/[0.08] disabled:opacity-40"
        >
          ▶ {t("uploader.promoTrimPreview")}
        </button>
      </div>
      {error ? (
        <p className="mt-3 text-xs font-medium text-red-400" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
