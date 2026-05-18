"use client";

type Props = {
  src: string;
  className?: string;
  /** Tall portrait videos are capped so the page stays usable */
  maxHeightClass?: string;
};

/**
 * Renders at the video's intrinsic aspect ratio (no forced 16:9 letterboxing).
 */
export default function PlaybackVideo({
  src,
  className = "",
  maxHeightClass = "max-h-[80vh]",
}: Props) {
  return (
    <div
      className={`w-full rounded-xl overflow-hidden bg-black border border-white/10 flex justify-center ${className}`}
    >
      <video
        src={src}
        controls
        playsInline
        preload="metadata"
        className={`w-full h-auto ${maxHeightClass} block`}
      />
    </div>
  );
}
