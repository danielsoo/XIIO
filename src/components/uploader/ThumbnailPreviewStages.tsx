"use client";

import type { CSSProperties } from "react";
import { promoCropToVideoStyle } from "@/lib/works/promo-crop-interaction";
import type { PromoFrameCrop } from "@/types/work";

type StageProps = {
  title: string;
  hint: string;
  src: string;
  aspectRatio: string;
  imageStyle?: CSSProperties;
};

function ThumbnailStage({ title, hint, src, aspectRatio, imageStyle }: StageProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/40 p-3">
      <p className="text-xs text-white/90">{title}</p>
      <p className="text-[11px] text-xiio-muted mb-2">{hint}</p>
      <div
        className="relative overflow-hidden rounded-lg border border-white/10 bg-black"
        style={{ aspectRatio }}
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

type GridProps = {
  src: string;
  fullTitle: string;
  fullHint: string;
  shortsTitle: string;
  shortsHint: string;
  crop?: PromoFrameCrop;
};

export default function ThumbnailPreviewStages({
  src,
  fullTitle,
  fullHint,
  shortsTitle,
  shortsHint,
  crop,
}: GridProps) {
  const imageStyle = crop ? promoCropToVideoStyle(crop) : undefined;
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <ThumbnailStage
        title={fullTitle}
        hint={fullHint}
        src={src}
        aspectRatio="16 / 9"
        imageStyle={imageStyle}
      />
      <ThumbnailStage
        title={shortsTitle}
        hint={shortsHint}
        src={src}
        aspectRatio="9 / 16"
        imageStyle={imageStyle}
      />
    </div>
  );
}
