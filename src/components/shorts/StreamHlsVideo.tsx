"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  type Ref,
} from "react";
import { isHlsSource } from "@/lib/video/isHlsSource";

export type StreamHlsVideoHandle = {
  play: () => Promise<void>;
  pause: () => void;
  get currentTime(): number;
  set currentTime(value: number);
};

type Props = {
  src: string;
  className?: string;
  muted?: boolean;
  loop?: boolean;
  playsInline?: boolean;
  preload?: "auto" | "metadata" | "none";
  autoPlay?: boolean;
  onEnded?: () => void;
  onReady?: () => void;
  onError?: () => void;
};

function canPlayNativeHls(): boolean {
  if (typeof document === "undefined") return false;
  const v = document.createElement("video");
  return v.canPlayType("application/vnd.apple.mpegurl") !== "";
}

const StreamHlsVideo = forwardRef(function StreamHlsVideo(
  {
    src,
    className = "",
    muted = true,
    loop = false,
    playsInline = true,
    preload = "metadata",
    autoPlay = false,
    onEnded,
    onReady,
    onError,
  }: Props,
  ref: Ref<StreamHlsVideoHandle>
) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<import("hls.js").default | null>(null);
  const readyFiredRef = useRef(false);

  useImperativeHandle(ref, () => ({
    play: async () => {
      const video = videoRef.current;
      if (!video) return;
      await video.play().catch(() => {});
    },
    pause: () => videoRef.current?.pause(),
    get currentTime() {
      return videoRef.current?.currentTime ?? 0;
    },
    set currentTime(value: number) {
      if (videoRef.current) videoRef.current.currentTime = value;
    },
  }));

  useEffect(() => {
    readyFiredRef.current = false;
    const video = videoRef.current;
    if (!video || !src) return;

    const fireReady = () => {
      if (readyFiredRef.current) return;
      readyFiredRef.current = true;
      onReady?.();
    };

    const handleError = () => {
      onError?.();
    };

    const handleLoadedData = () => fireReady();

    video.addEventListener("loadeddata", handleLoadedData);
    video.addEventListener("error", handleError);

    let cancelled = false;

    const setup = async () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }

      video.removeAttribute("src");
      video.load();

      if (!isHlsSource(src)) {
        video.src = src;
        if (autoPlay) void video.play().catch(() => {});
        return;
      }

      if (canPlayNativeHls()) {
        video.src = src;
        if (autoPlay) void video.play().catch(() => {});
        return;
      }

      try {
        const Hls = (await import("hls.js")).default;
        if (cancelled) return;
        if (!Hls.isSupported()) {
          video.src = src;
          if (autoPlay) void video.play().catch(() => {});
          return;
        }
        const hls = new Hls({ enableWorker: true });
        hlsRef.current = hls;
        hls.loadSource(src);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          fireReady();
          if (autoPlay) void video.play().catch(() => {});
        });
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) {
            handleError();
          }
        });
      } catch {
        video.src = src;
        handleError();
      }
    };

    void setup();

    return () => {
      cancelled = true;
      video.removeEventListener("loadeddata", handleLoadedData);
      video.removeEventListener("error", handleError);
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [src, autoPlay, onReady, onError]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !onEnded) return;
    const handler = () => onEnded();
    video.addEventListener("ended", handler);
    return () => video.removeEventListener("ended", handler);
  }, [onEnded]);

  return (
    <video
      ref={videoRef}
      className={className}
      playsInline={playsInline}
      muted={muted}
      loop={loop}
      preload={preload}
    />
  );
});

export default StreamHlsVideo;
