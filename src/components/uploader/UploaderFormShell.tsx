"use client";

import type { ReactNode } from "react";

type Props = {
  banners?: ReactNode;
  left: ReactNode;
  right: ReactNode;
  footer?: ReactNode;
};

/** 업로드·쇼츠 편집 공통 2열 레이아웃 */
export default function UploaderFormShell({ banners, left, right, footer }: Props) {
  return (
    <div className="space-y-8">
      {banners}
      <div className="grid gap-8 lg:grid-cols-2 lg:gap-10 lg:items-start">
        <div className="min-w-0">{left}</div>
        <div className="space-y-8 min-w-0">{right}</div>
      </div>
      {footer}
    </div>
  );
}
