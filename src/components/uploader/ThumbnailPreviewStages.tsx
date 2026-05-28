"use client";

type StageProps = {
  title: string;
  hint: string;
  src: string;
  aspectRatio: string;
};

function ThumbnailStage({ title, hint, src, aspectRatio }: StageProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/40 p-3">
      <p className="text-xs text-white/90">{title}</p>
      <p className="text-[11px] text-xiio-muted mb-2">{hint}</p>
      <div
        className="relative overflow-hidden rounded-lg border border-white/10 bg-black"
        style={{ aspectRatio }}
      >
        <img src={src} alt="" className="absolute inset-0 w-full h-full object-cover" />
      </div>
    </div>
  );
}

type GridProps = {
  src: string;
  fullTitle: string;
  fullHint: string;
  shortsTitle: string;
  shortsHint: string;
};

export default function ThumbnailPreviewStages({
  src,
  fullTitle,
  fullHint,
  shortsTitle,
  shortsHint,
}: GridProps) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <ThumbnailStage title={fullTitle} hint={fullHint} src={src} aspectRatio="16 / 9" />
      <ThumbnailStage title={shortsTitle} hint={shortsHint} src={src} aspectRatio="9 / 16" />
    </div>
  );
}
