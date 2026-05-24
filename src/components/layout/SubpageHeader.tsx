"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useTranslations } from "@/context/LocaleContext";

type Props = {
  title?: string;
  /** When set, back is a direct link instead of browser history. */
  backHref?: string;
  backLabel?: string;
  backFallbackHref?: string;
  showHome?: boolean;
  variant?: "withNavbar" | "standalone";
  endContent?: ReactNode;
};

function XiioLogoLink({ className }: { className?: string }) {
  const { t } = useTranslations();
  return (
    <Link
      href="/"
      className={`inline-flex flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-xiio-accent rounded ${className ?? ""}`}
      aria-label={t("common.logoHome")}
    >
      <span className="text-2xl font-black tracking-widest text-white">
        X<span className="text-xiio-accent">II</span>O
      </span>
    </Link>
  );
}

export default function SubpageHeader({
  title,
  backHref,
  backLabel,
  backFallbackHref = "/",
  showHome = true,
  variant = "withNavbar",
  endContent,
}: Props) {
  const router = useRouter();
  const { t } = useTranslations();
  const backText = backLabel ?? t("common.goBack");

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push(backFallbackHref);
  };

  const backControl = backHref ? (
    <Link
      href={backHref}
      className="inline-flex items-center gap-1.5 min-h-[44px] py-2 pr-2 text-base font-medium text-white hover:text-xiio-accent transition"
    >
      <span aria-hidden className="text-lg leading-none">
        ←
      </span>
      <span>{backText}</span>
    </Link>
  ) : (
    <button
      type="button"
      onClick={handleBack}
      className="inline-flex items-center gap-1.5 min-h-[44px] py-2 pr-2 text-base font-medium text-white hover:text-xiio-accent transition"
    >
      <span aria-hidden className="text-lg leading-none">
        ←
      </span>
      <span>{backText}</span>
    </button>
  );

  const homeControl = showHome ? (
    <Link
      href="/"
      className="inline-flex items-center justify-center gap-1.5 min-h-[44px] min-w-[44px] px-3 py-2 rounded-lg text-base font-medium text-white border border-white/20 hover:bg-white/5 transition"
      aria-label={t("common.goHome")}
    >
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h3m8-11v11a1 1 0 01-1 1h-3"
        />
      </svg>
      <span>{t("common.goHome")}</span>
    </Link>
  ) : null;

  const navRow = (
    <div className="flex items-center gap-2 border-b border-white/10 mb-6 pb-1">
      <div className="flex-1 min-w-0 flex items-center">{backControl}</div>
      {title ? (
        <p className="hidden sm:block flex-shrink-0 max-w-[40%] truncate text-base font-semibold text-xiio-muted text-center px-2">
          {title}
        </p>
      ) : null}
      <div className="flex-1 min-w-0 flex items-center justify-end gap-2">
        {endContent}
        {homeControl}
      </div>
    </div>
  );

  if (variant === "standalone") {
    return (
      <header className="mb-6">
        <div className="flex items-center border-b border-white/10 pb-4 mb-4">
          <XiioLogoLink />
        </div>
        {navRow}
        {title ? <h1 className="text-2xl md:text-3xl font-bold text-white">{title}</h1> : null}
      </header>
    );
  }

  return (
    <header className="mb-6">
      {navRow}
      {title ? <h1 className="text-2xl font-bold text-white">{title}</h1> : null}
    </header>
  );
}
