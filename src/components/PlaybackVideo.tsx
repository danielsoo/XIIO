"use client";

type Props = {
  src: string;
  className?: string;
  /** Tall portrait videos are capped so the page stays usable */
  maxHeightClass?: string;
  /** Optional viewing frame. When omitted, the intrinsic video ratio is used. */
  aspectRatio?: number;
};

/**
 * Renders at the video's intrinsic aspect ratio (no forced 16:9 letterboxing).
 */
export default function PlaybackVideo({
  src,
  className = "",
  maxHeightClass = "max-h-[80vh]",
  aspectRatio,
}: Props) {
  const frameMaxWidth = aspectRatio
    ? aspectRatio < 0.75
      ? "min(360px, 100%)"
      : aspectRatio <= 1.05
        ? "min(620px, 100%)"
        : aspectRatio < 1.5
          ? "min(900px, 100%)"
          : "100%"
    : undefined;

  return (
    <div
      className={`relative mx-auto w-full rounded-xl overflow-hidden bg-black border border-white/10 flex justify-center ${className}`}
      style={aspectRatio ? { aspectRatio, maxWidth: frameMaxWidth } : undefined}
    >
      <video
        src={src}
        controls
        playsInline
        preload="metadata"
        className={
          aspectRatio
            ? `absolute inset-0 h-full w-full object-contain ${maxHeightClass}`
            : `block h-auto w-full ${maxHeightClass}`
        }
      />
    </div>
  );
}
