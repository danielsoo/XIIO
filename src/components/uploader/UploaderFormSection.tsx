"use client";

import type { ReactNode } from "react";

type Props = {
  title: string;
  hint?: string;
  children: ReactNode;
};

/** 업로드 폼 분류 구역 카드 */
export default function UploaderFormSection({ title, hint, children }: Props) {
  return (
    <section className="rounded-2xl border border-white/10 bg-xiio-surface p-6 md:p-8 space-y-5">
      <header>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        {hint ? <p className="mt-1 text-sm text-xiio-muted">{hint}</p> : null}
      </header>
      <div className="space-y-5">{children}</div>
    </section>
  );
}
