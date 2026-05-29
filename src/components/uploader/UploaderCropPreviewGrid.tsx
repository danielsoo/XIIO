"use client";

import type { ReactNode } from "react";

type Props = {
  cropHint?: string;
  leftLabel: string;
  left: ReactNode;
  rightLabel: string;
  right: ReactNode;
};

function GridCard({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/50 p-3">
      <p className="text-xs text-xiio-muted mb-2">{label}</p>
      {children}
    </div>
  );
}

export default function UploaderCropPreviewGrid({
  cropHint,
  leftLabel,
  left,
  rightLabel,
  right,
}: Props) {
  return (
    <div className="space-y-3">
      {cropHint ? <p className="text-xs text-white/85">{cropHint}</p> : null}
      <div className="grid gap-3 md:grid-cols-2">
        <GridCard label={leftLabel}>{left}</GridCard>
        <GridCard label={rightLabel}>{right}</GridCard>
      </div>
    </div>
  );
}
