"use client";

import { useEffect, useRef } from "react";
import StreamHlsVideo from "@/components/shorts/StreamHlsVideo";
import { useWatchProgressReporter } from "@/hooks/useWatchProgressReporter";

type Props = {
  src: string;
  title: string;
  ownerUid: string;
  workId: string;
  className?: string;
};

/** Direct HLS player with manual quality selection and watch progress reporting. */
export default function StreamProgressIframe({ src, title, ownerUid, workId, className }: Props) {
  const durationRef = useRef(0);
  const { report, flush } = useWatchProgressReporter(ownerUid, workId);

  useEffect(() => {
    return () => {
      flush(durationRef.current);
    };
  }, [flush]);

  return (
    <StreamHlsVideo
      src={src}
      ariaLabel={title}
      className={className}
      playsInline
      muted={false}
      loop={false}
      preload="auto"
      controls
      preferHighStart
      showQualitySelector
      onLoadedMetadata={(event) => {
        const duration = event.currentTarget.duration;
        if (Number.isFinite(duration) && duration > 0) durationRef.current = duration;
      }}
      onTimeUpdate={(event) => {
        const video = event.currentTarget;
        if (Number.isFinite(video.duration) && video.duration > 0) {
          durationRef.current = video.duration;
        }
        report(video.currentTime, durationRef.current);
      }}
      onPause={(event) => {
        report(event.currentTarget.currentTime, durationRef.current, { force: true });
      }}
    />
  );
}
