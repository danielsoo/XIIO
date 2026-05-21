"use client";

import Link from "next/link";

type Props = {
  message: string;
  ctaLabel: string;
  ctaHref: string;
};

export default function AccountEmptyState({ message, ctaLabel, ctaHref }: Props) {
  return (
    <div className="rounded-2xl border border-dashed border-white/15 py-10 px-6 text-center">
      <p className="text-sm text-xiio-muted mb-4">{message}</p>
      <Link
        href={ctaHref}
        className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-medium bg-xiio-accent hover:bg-xiio-accent-hover text-white transition"
      >
        {ctaLabel}
      </Link>
    </div>
  );
}
