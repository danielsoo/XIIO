"use client";

import type { CSSProperties } from "react";
import { promoCropToVideoStyle } from "@/lib/works/promo-crop-interaction";
import type { PromoFrameCrop } from "@/types/work";

type InnerAspect = "16/9" | "9/16";
type MediaType = "image" | "video";

type Props = {
  src: string;
  crop?: PromoFrameCrop;
  innerAspect?: InnerAspect;
  media?: MediaType;
};

export default function ExposurePreviewFrame({
  src,
  crop,
  innerAspect = "16/9",
  media = "image",
}: Props) {
  const mediaStyle: CSSProperties | undefined = crop ? promoCropToVideoStyle(crop) : undefined;

  const mediaClassName = "absolute inset-0 w-full h-full object-cover";

  const inner =
    innerAspect === "9/16" ? (
      <div className="flex h-full w-full items-center justify-center">
        <div className="relative h-full aspect-[9/16] overflow-hidden">
          {media === "video" ? (
            <video
              src={src}
              className={mediaClassName}
              style={mediaStyle}
              muted
              playsInline
              preload="metadata"
            />
          ) : (
            <img src={src} alt="" className={mediaClassName} style={mediaStyle} />
          )}
        </div>
      </div>
    ) : media === "video" ? (
      <video
        src={src}
        className={mediaClassName}
        style={mediaStyle}
        muted
        playsInline
        preload="metadata"
      />
    ) : (
      <img src={src} alt="" className={mediaClassName} style={mediaStyle} />
    );

  return (
    <div
      className="relative w-full overflow-hidden rounded-lg border border-white/10 bg-black aspect-video"
    >
      {inner}
    </div>
  );
}
