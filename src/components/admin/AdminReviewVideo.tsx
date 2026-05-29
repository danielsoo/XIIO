"use client";

import PlaybackVideo from "@/components/PlaybackVideo";
import StreamHlsVideo from "@/components/shorts/StreamHlsVideo";
import { isHlsSource } from "@/lib/video/isHlsSource";

type Props = {
  src: string;
  className?: string;
  maxHeightClass?: string;
};

/**
 * Admin review playback — HLS with high-start ABR; MP4/direct URLs use native video.
 */
export default function AdminReviewVideo({
  src,
  className = "",
  maxHeightClass = "max-h-[80vh]",
}: Props) {
  if (isHlsSource(src)) {
    return (
      <div
        className={`w-full rounded-xl overflow-hidden bg-black border border-white/10 flex justify-center ${className}`}
      >
        <StreamHlsVideo
          src={src}
          controls
          playsInline
          preload="auto"
          preferHighStart
          className={`w-full h-auto ${maxHeightClass} block`}
        />
      </div>
    );
  }

  return <PlaybackVideo src={src} className={className} maxHeightClass={maxHeightClass} />;
}
