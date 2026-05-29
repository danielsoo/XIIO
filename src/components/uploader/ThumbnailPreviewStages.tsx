"use client";

import type { CSSProperties } from "react";
import { promoCropToVideoStyle } from "@/lib/works/promo-crop-interaction";
import type { PromoFrameCrop } from "@/types/work";

type Props = {
  src: string;
  title: string;
  hint: string;
  crop?: PromoFrameCrop;
};

export default function ThumbnailPreviewStages({ src, title, hint, crop }: Props) {
  const imageStyle: CSSProperties | undefined = crop ? promoCropToVideoStyle(crop) : undefined;

  return (
    <div className="rounded-xl border border-white/10 bg-black/40 p-3">
      <p className="text-xs text-white/90">{title}</p>
      <p className="text-[11px] text-xiio-muted mb-2">{hint}</p>
      <div
        className="relative overflow-hidden rounded-lg border border-white/10 bg-black"
        style={{ aspectRatio: "16 / 9" }}
      >
        <img
          src={src}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={imageStyle}
        />
      </div>
    </div>
  );
}
