"use client";

import { useEffect, useState } from "react";

/** 선택한 로컬 영상 파일의 재생 길이(초) */
export function useVideoFileDuration(file: File | null): number | null {
  const [duration, setDuration] = useState<number | null>(null);

  useEffect(() => {
    if (!file) {
      setDuration(null);
      return;
    }
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";

    const onLoaded = () => {
      const d = video.duration;
      setDuration(Number.isFinite(d) && d > 0 ? d : null);
      URL.revokeObjectURL(url);
    };
    const onError = () => {
      setDuration(null);
      URL.revokeObjectURL(url);
    };

    video.addEventListener("loadedmetadata", onLoaded);
    video.addEventListener("error", onError);
    video.src = url;

    return () => {
      video.removeEventListener("loadedmetadata", onLoaded);
      video.removeEventListener("error", onError);
      URL.revokeObjectURL(url);
    };
  }, [file]);

  return duration;
}
