"use client";

import ExposurePreviewFrame from "@/components/uploader/ExposurePreviewFrame";
import type { PromoFrameCrop } from "@/types/work";

type Props = {
  src: string;
  title: string;
  hint: string;
  crop?: PromoFrameCrop;
  /** When true, omit outer card (for use inside UploaderCropPreviewGrid). */
  embedded?: boolean;
};

export default function ThumbnailPreviewStages({
  src,
  title,
  hint,
  crop,
  embedded = false,
}: Props) {
  const frame = <ExposurePreviewFrame src={src} crop={crop} innerAspect="16/9" media="image" />;

  if (embedded) {
    return (
      <>
        <p className="text-[11px] text-xiio-muted mb-2">{hint}</p>
        {frame}
      </>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-black/40 p-3">
      <p className="text-xs text-white/90">{title}</p>
      <p className="text-[11px] text-xiio-muted mb-2">{hint}</p>
      {frame}
    </div>
  );
}
