"use client";

import type { ReactNode } from "react";

type Props = {
  banners?: ReactNode;
  /** stacked: 업로드 분류 카드 세로 흐름, split: 쇼츠 편집 2열 */
  layout?: "stacked" | "split";
  left?: ReactNode;
  right?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
};

export default function UploaderFormShell({
  banners,
  layout = "split",
  left,
  right,
  children,
  footer,
}: Props) {
  return (
    <div className="space-y-6">
      {banners}
      {layout === "stacked" ? (
        <div className="flex flex-col gap-6 min-w-0">{children}</div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-10 lg:items-start">
          <div className="min-w-0">{left}</div>
          <div className="space-y-8 min-w-0">{right}</div>
        </div>
      )}
      {footer}
    </div>
  );
}
