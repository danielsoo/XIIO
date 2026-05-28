"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useTranslations } from "@/context/LocaleContext";
import type { VideoFileMetadata } from "@/hooks/useVideoFileMetadata";
import { defaultPromoFrameCrop, normalizePromoFrameCrop } from "@/lib/works/promo-crop";
import type { PromoFrameCrop } from "@/types/work";

type Props = {
  file: File | null;
  onFileChange: (file: File | null) => void;
  disabled?: boolean;
  crop?: PromoFrameCrop | null;
  onCropChange?: (next: PromoFrameCrop | null) => void;
  meta?: VideoFileMetadata | null;
  showPortraitPreview?: boolean;
};

export default function VideoUploadDropzone({
  file,
  onFileChange,
  disabled,
  crop,
  onCropChange,
  meta,
  showPortraitPreview = false,
}: Props) {
  const { t } = useTranslations();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const effectiveCrop = normalizePromoFrameCrop(crop ?? defaultPromoFrameCrop());

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const pickFile = useCallback(
    (next: File | null) => {
      if (disabled) return;
      if (next && !next.type.startsWith("video/")) return;
      onFileChange(next);
      if (!next) onCropChange?.(null);
    },
    [disabled, onFileChange, onCropChange]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const dropped = e.dataTransfer.files?.[0];
      if (dropped) pickFile(dropped);
    },
    [pickFile]
  );

  return (
    <div className="flex flex-col min-h-[280px] lg:min-h-[360px]">
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="video/*"
        className="sr-only"
        disabled={disabled}
        onChange={(e) => {
          pickFile(e.target.files?.[0] ?? null);
        }}
      />

      {file && previewUrl ? (
        <div className="flex flex-1 flex-col rounded-2xl border border-white/10 bg-black/40 overflow-hidden">
          <div className="relative flex-1 min-h-[200px] bg-black">
            <video
              src={previewUrl}
              className="absolute inset-0 w-full h-full object-contain"
              controls
              playsInline
              preload="metadata"
            />
          </div>
          <div className="shrink-0 px-4 py-3 border-t border-white/10 bg-xiio-surface/80">
            <p className="text-xs text-xiio-muted mb-0.5">{t("uploader.dropzoneFileSelected")}</p>
            <p className="text-sm text-white truncate font-medium" title={file.name}>
              {file.name}
            </p>
            <button
              type="button"
              disabled={disabled}
              onClick={() => {
                onFileChange(null);
                onCropChange?.(null);
                if (inputRef.current) inputRef.current.value = "";
              }}
              className="mt-2 text-sm text-xiio-accent hover:underline disabled:opacity-40"
            >
              {t("uploader.dropzoneChangeFile")}
            </button>
            {meta ? (
              <p className="mt-1 text-xs text-xiio-muted">
                {t("uploader.promoSourceMeta", {
                  width: meta.width,
                  height: meta.height,
                  sec: Math.max(0, meta.duration).toFixed(1),
                })}
              </p>
            ) : null}
          </div>
          {showPortraitPreview && onCropChange ? (
            <div className="border-t border-white/10 px-4 py-4 bg-xiio-surface/90">
              <p className="text-xs text-white/85 mb-2">{t("uploader.promoCropHint")}</p>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-black/50 p-3">
                  <p className="text-xs text-xiio-muted mb-2">{t("uploader.promoRawPreview")}</p>
                  <div className="relative w-full rounded-lg overflow-hidden border border-white/10 bg-black" style={{ aspectRatio: "16 / 9" }}>
                    <video src={previewUrl} className="absolute inset-0 w-full h-full object-contain" muted playsInline preload="metadata" />
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/50 p-3">
                  <p className="text-xs text-xiio-muted mb-2">{t("uploader.promoShortsPreview")}</p>
                  <div className="mx-auto relative rounded-lg overflow-hidden border border-white/10 bg-black" style={{ width: 180, maxWidth: "100%", aspectRatio: "9 / 16" }}>
                    <video
                      src={previewUrl}
                      className="absolute inset-0 w-full h-full object-cover"
                      style={{
                        objectPosition: `${effectiveCrop.focalX}% ${effectiveCrop.focalY}%`,
                        transform: `scale(${effectiveCrop.zoom})`,
                        transformOrigin: `${effectiveCrop.focalX}% ${effectiveCrop.focalY}%`,
                      }}
                      muted
                      playsInline
                      preload="metadata"
                    />
                  </div>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                <RangeControl
                  label={t("uploader.promoCropFocusX")}
                  min={0}
                  max={100}
                  step={1}
                  value={effectiveCrop.focalX}
                  disabled={disabled}
                  onChange={(value) => onCropChange({ ...effectiveCrop, focalX: value })}
                />
                <RangeControl
                  label={t("uploader.promoCropFocusY")}
                  min={0}
                  max={100}
                  step={1}
                  value={effectiveCrop.focalY}
                  disabled={disabled}
                  onChange={(value) => onCropChange({ ...effectiveCrop, focalY: value })}
                />
                <RangeControl
                  label={t("uploader.promoCropZoom")}
                  min={1}
                  max={2.5}
                  step={0.05}
                  value={effectiveCrop.zoom}
                  disabled={disabled}
                  onChange={(value) => onCropChange({ ...effectiveCrop, zoom: value })}
                />
              </div>
            </div>
          ) : null}
          {!showPortraitPreview ? null : (
            <div className="border-t border-white/10 px-4 py-2 bg-xiio-surface/80">
              <p className="text-xs text-xiio-muted">{t("uploader.promoPortraitNotice")}</p>
            </div>
          )}
        </div>
      ) : (
        <label
          htmlFor={inputId}
          onDragEnter={(e) => {
            e.preventDefault();
            if (!disabled) setDragOver(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setDragOver(false);
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          className={`flex flex-1 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 text-center cursor-pointer transition ${
            disabled
              ? "opacity-40 cursor-not-allowed border-white/10 bg-white/5"
              : dragOver
                ? "border-xiio-accent bg-xiio-accent/10"
                : "border-white/20 bg-white/5 hover:border-xiio-accent/50 hover:bg-white/[0.07]"
          }`}
        >
          <svg
            viewBox="0 0 24 24"
            className="w-12 h-12 text-xiio-muted"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          <div>
            <p className="text-base font-semibold text-white">{t("uploader.dropzoneTitle")}</p>
            <p className="text-sm text-xiio-muted mt-1">{t("uploader.dropzoneHint")}</p>
          </div>
        </label>
      )}
    </div>
  );
}

type RangeControlProps = {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  disabled?: boolean;
  onChange: (value: number) => void;
};

function RangeControl({ label, min, max, step, value, disabled, onChange }: RangeControlProps) {
  return (
    <label className="block">
      <div className="mb-1 flex items-center justify-between text-xs text-xiio-muted">
        <span>{label}</span>
        <span className="tabular-nums">{value.toFixed(step < 1 ? 2 : 0)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-xiio-accent"
      />
    </label>
  );
}
