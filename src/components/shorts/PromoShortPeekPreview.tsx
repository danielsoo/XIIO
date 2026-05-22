"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import StreamHlsVideo, { type StreamHlsVideoHandle } from "@/components/shorts/StreamHlsVideo";
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
  const videoRef = useRef<StreamHlsVideoHandle>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  const showFrame = useCallback(() => {
    const handle = videoRef.current;
    if (!handle) return;
    handle.pause();
    if (handle.currentTime < 0.05) {
      handle.currentTime = 0.1;
    }
    setReady(true);
    setFailed(false);
  }, []);

  useEffect(() => {
    setReady(false);
    setFailed(false);
  }, [item.videoUrl, item.id]);

  const usePoster = failed && Boolean(item.thumbnailUrl);

  return (
    <div
      className={`relative h-full w-full pointer-events-none ${visible ? "" : "invisible"}`}
    >
      <div
        className="relative h-full w-full scale-90 origin-center overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-gray-900 via-[#1a0533]/90 to-gray-900 shadow-lg shadow-black/40"
      >
        {usePoster ? (
          <img
            src={item.thumbnailUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <StreamHlsVideo
            ref={videoRef}
            src={item.videoUrl}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-150 ${
              ready ? "opacity-100" : "opacity-0"
            }`}
            muted
            playsInline
            preload={preload}
            onReady={showFrame}
            onError={() => {
              setFailed(true);
              setReady(true);
            }}
          />
        )}
        <div className="absolute inset-0 bg-black/35 pointer-events-none" />
      </div>
    </div>
  );
}
