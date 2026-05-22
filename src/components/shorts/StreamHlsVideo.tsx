"use client";

import Hls from "hls.js";
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

const HLS_OPTIONS: Partial<Hls["config"]> = {
  enableWorker: true,
  startLevel: 0,
  maxBufferLength: 15,
  maxMaxBufferLength: 30,
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
  const hlsRef = useRef<Hls | null>(null);
  const attachedSrcRef = useRef<string | null>(null);
  const readyFiredRef = useRef(false);
  const onReadyRef = useRef(onReady);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onReadyRef.current = onReady;
    onErrorRef.current = onError;
  }, [onReady, onError]);

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
    const video = videoRef.current;
    if (!video || !src) return;

    if (attachedSrcRef.current === src) {
      return;
    }

    readyFiredRef.current = false;

    const fireReady = () => {
      if (readyFiredRef.current) return;
      readyFiredRef.current = true;
      onReadyRef.current?.();
    };

    const handleError = () => onErrorRef.current?.();
    const handleLoadedData = () => fireReady();

    video.addEventListener("loadeddata", handleLoadedData);
    video.addEventListener("error", handleError);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    attachedSrcRef.current = null;

    if (!isHlsSource(src)) {
      video.src = src;
      attachedSrcRef.current = src;
    } else if (canPlayNativeHls()) {
      video.src = src;
      attachedSrcRef.current = src;
    } else if (Hls.isSupported()) {
      const hls = new Hls(HLS_OPTIONS);
      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);
      attachedSrcRef.current = src;
      hls.on(Hls.Events.MANIFEST_PARSED, () => fireReady());
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) handleError();
      });
    } else {
      video.src = src;
      attachedSrcRef.current = src;
    }

    return () => {
      video.removeEventListener("loadeddata", handleLoadedData);
      video.removeEventListener("error", handleError);
    };
  }, [src]);

  useEffect(() => {
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      attachedSrcRef.current = null;
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (autoPlay) {
      void video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [autoPlay]);

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
