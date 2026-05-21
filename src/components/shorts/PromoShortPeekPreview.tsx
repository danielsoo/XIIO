"use client";

import { useEffect, useRef } from "react";
import type { PromoShort } from "@/types/promoShort";

type Props = {
  item: PromoShort;
};

/** 홈 히어로 좌·우 피크 — 고정 9:16, 정지 프레임만 표시 */
export default function PromoShortPeekPreview({ item }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    const showFrame = () => {
      if (video.readyState >= 1) {
        video.currentTime = 0.1;
        video.pause();
      }
    };
    showFrame();
    video.addEventListener("loadeddata", showFrame);
    return () => video.removeEventListener("loadeddata", showFrame);
  }, [item.videoUrl, item.id]);

  return (
    <div className="relative h-full w-full" aria-hidden>
      <div className="relative h-full w-full scale-90 origin-center overflow-hidden rounded-2xl border border-white/10 bg-black shadow-lg shadow-black/40">
        <video
          ref={videoRef}
          src={item.videoUrl}
          className="absolute inset-0 h-full w-full object-cover"
          playsInline
          muted
          preload="auto"
        />
        <div className="absolute inset-0 bg-black/35 pointer-events-none" />
      </div>
    </div>
  );
}
