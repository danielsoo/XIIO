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
  /** 히어로 teaser 등 — 첫 재생을 가능한 한 높은 레벨에서 시작 */
  preferHighStart?: boolean;
  onEnded?: () => void;
  onReady?: () => void;
  onError?: () => void;
  controls?: boolean;
  onLoadedMetadata?: (e: React.SyntheticEvent<HTMLVideoElement>) => void;
  onTimeUpdate?: (e: React.SyntheticEvent<HTMLVideoElement>) => void;
  onSeeking?: (e: React.SyntheticEvent<HTMLVideoElement>) => void;
  onSeeked?: (e: React.SyntheticEvent<HTMLVideoElement>) => void;
};

const HLS_BUFFER_OPTS: Partial<Hls["config"]> = {
  enableWorker: true,
  maxBufferLength: 15,
  maxMaxBufferLength: 30,
};

/** 일반 숏츠 피드 — ABR·대역폭 프로브 유지 */
const HLS_OPTIONS_ABR: Partial<Hls["config"]> = {
  ...HLS_BUFFER_OPTS,
  startLevel: -1,
  testBandwidth: true,
  capLevelToPlayerSize: true,
};

/** 히어로 teaser — 최고 레벨만 로드, 프로브 세그먼트 없음 */
const HLS_OPTIONS_HIGH_START: Partial<Hls["config"]> = {
  ...HLS_BUFFER_OPTS,
  startLevel: -1,
  testBandwidth: false,
  autoStartLoad: false,
  capLevelToPlayerSize: false,
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
    preferHighStart = false,
    onEnded,
    onReady,
    onError,
    controls = false,
    onLoadedMetadata,
    onTimeUpdate,
    onSeeking,
    onSeeked,
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

    let targetMaxLevel = -1;
    let useHlsJsHighStart = false;

    const tryFireReadyAtMaxLevel = () => {
      const hls = hlsRef.current;
      if (!hls || targetMaxLevel < 0) return;
      if (hls.currentLevel !== targetMaxLevel) return;
      if (video.readyState < HTMLMediaElement.HAVE_FUTURE_DATA) return;
      fireReady();
    };

    const handleCanPlay = () => {
      if (useHlsJsHighStart) {
        tryFireReadyAtMaxLevel();
        return;
      }
      fireReady();
    };

    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("error", handleError);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    attachedSrcRef.current = null;
    useHlsJsHighStart = false;

    if (!isHlsSource(src)) {
      video.src = src;
      attachedSrcRef.current = src;
    } else if (canPlayNativeHls()) {
      video.src = src;
      attachedSrcRef.current = src;
    } else if (Hls.isSupported()) {
      const highStart = preferHighStart;
      useHlsJsHighStart = highStart;
      const hls = new Hls(highStart ? HLS_OPTIONS_HIGH_START : HLS_OPTIONS_ABR);
      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);
      attachedSrcRef.current = src;

      if (highStart) {
        const onManifestParsed = () => {
          if (hls.levels.length === 0) {
            hls.startLoad(-1);
            return;
          }
          const max = hls.levels.length - 1;
          targetMaxLevel = max;
          hls.startLevel = max;
          hls.nextLoadLevel = max;
          hls.loadLevel = max;
          hls.startLoad(-1);
        };
        hls.on(Hls.Events.MANIFEST_PARSED, onManifestParsed);
        hls.on(Hls.Events.LEVEL_SWITCHED, tryFireReadyAtMaxLevel);
        hls.on(Hls.Events.FRAG_BUFFERED, tryFireReadyAtMaxLevel);
      }

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) handleError();
      });
    } else {
      video.src = src;
      attachedSrcRef.current = src;
    }

    return () => {
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("error", handleError);
    };
  }, [src, preferHighStart]);

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
      controls={controls}
      controlsList={controls ? "nodownload" : undefined}
      onLoadedMetadata={onLoadedMetadata}
      onTimeUpdate={onTimeUpdate}
      onSeeking={onSeeking}
      onSeeked={onSeeked}
    />
  );
});

export default StreamHlsVideo;
