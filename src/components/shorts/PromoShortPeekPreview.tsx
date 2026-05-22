"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PromoShort } from "@/types/promoShort";

type Props = {
  item: PromoShort;
  visible?: boolean;
  preload?: "auto" | "metadata" | "none";
};

/** 홈 히어로 좌·우 피크 — 고정 9:16, 정지 프레임만 표시 */
export default function PromoShortPeekPreview({
  item,
  visible = true,
  preload = "auto",
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);

  const showFrame = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.readyState < 1) return;
    video.currentTime = 0.1;
    video.pause();
    setReady(true);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.pause();

    if (video.readyState >= 1) {
      showFrame();
    } else {
      setReady(false);
    }

    video.addEventListener("loadeddata", showFrame);
    return () => video.removeEventListener("loadeddata", showFrame);
  }, [item.videoUrl, item.id, showFrame]);

  useEffect(() => {
    if (preload === "none") return;
    const video = videoRef.current;
    if (!video) return;
    video.load();
  }, [preload, item.videoUrl]);

  return (
    <div
      className={`relative h-full w-full pointer-events-none ${visible ? "" : "invisible"}`}
    >
      <div
        className="relative h-full w-full scale-90 origin-center overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-gray-900 via-[#1a0533]/90 to-gray-900 shadow-lg shadow-black/40"
        aria-hidden
      >
        <video
          ref={videoRef}
          src={item.videoUrl}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-150 ${
            ready ? "opacity-100" : "opacity-0"
          }`}
          playsInline
          muted
          preload={preload}
        />
        <div className="absolute inset-0 bg-black/35 pointer-events-none" />
      </div>
    </div>
  );
}
