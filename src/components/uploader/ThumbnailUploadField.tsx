"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "@/context/LocaleContext";

type Props = {
  file: File | null;
  previewUrl: string | null;
  onFileChange: (file: File | null, previewUrl: string | null) => void;
  disabled?: boolean;
  error?: string | null;
};

export default function ThumbnailUploadField({
  file,
  previewUrl,
  onFileChange,
  disabled = false,
  error,
}: Props) {
  const { t } = useTranslations();
  const [dragOver, setDragOver] = useState(false);

  const pickFile = useCallback(
    (next: File | null) => {
      if (disabled) return;
      if (!next) return;
      onFileChange(next, URL.createObjectURL(next));
    },
    [disabled, onFileChange]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.files?.[0] ?? null;
    pickFile(next);
  };

  return (
    <div>
      <label className="block text-xs text-xiio-muted mb-1.5" htmlFor="upload-promo-thumbnail">
        {t("uploader.uploadThumbnailLabel")}
        <span className="text-red-400 ml-1" aria-hidden>
          *
        </span>
      </label>
      <p className="text-xs text-xiio-muted mb-2">{t("uploader.uploadThumbnailHint")}</p>
      {error ? (
        <p className="text-xs text-red-400 mb-2" role="alert">
          {error}
        </p>
      ) : null}
      <label
        htmlFor="upload-promo-thumbnail"
        className={`flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-white/[0.03] px-4 py-6 cursor-pointer transition ${
          dragOver
            ? "border-xiio-accent/70 bg-xiio-accent/10"
            : "border-white/20 hover:border-xiio-accent/50"
        } ${
          disabled ? "opacity-40 pointer-events-none" : ""
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          if (disabled) return;
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (disabled) return;
          pickFile(e.dataTransfer.files?.[0] ?? null);
        }}
      >
        {previewUrl ? (
          <img
            src={previewUrl}
            alt=""
            className="max-h-40 w-full max-w-[200px] rounded-lg object-cover border border-white/10"
          />
        ) : (
          <span className="text-sm text-xiio-muted text-center">{t("uploader.uploadThumbnailPick")}</span>
        )}
        <span className="text-xs text-xiio-accent">
          {file ? t("uploader.uploadThumbnailChange") : t("uploader.uploadThumbnailPick")}
        </span>
        <input
          id="upload-promo-thumbnail"
          type="file"
          accept="image/*"
          className="sr-only"
          disabled={disabled}
          onChange={handleChange}
        />
      </label>
    </div>
  );
}
