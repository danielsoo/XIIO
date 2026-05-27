"use client";

import { useEffect, useState } from "react";

export type VideoFileMetadata = {
  duration: number;
  width: number;
  height: number;
};

/** Local video file duration and intrinsic dimensions */
export function useVideoFileMetadata(file: File | null): VideoFileMetadata | null {
  const [meta, setMeta] = useState<VideoFileMetadata | null>(null);

  useEffect(() => {
    if (!file) {
      setMeta(null);
      return;
    }
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";

    const onLoaded = () => {
      const duration = video.duration;
      const width = video.videoWidth;
      const height = video.videoHeight;
      if (
        Number.isFinite(duration) &&
        duration > 0 &&
        width > 0 &&
        height > 0
      ) {
        setMeta({ duration, width, height });
      } else {
        setMeta(null);
      }
      URL.revokeObjectURL(url);
    };
    const onError = () => {
      setMeta(null);
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

  return meta;
}
