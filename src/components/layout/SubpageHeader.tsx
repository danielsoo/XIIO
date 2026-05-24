"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useTranslations } from "@/context/LocaleContext";

type Props = {
  title?: string;
  description?: string;
  /** When set, back is a direct link instead of browser history. */
  backHref?: string;
  backLabel?: string;
  backFallbackHref?: string;
  showHome?: boolean;
  variant?: "withNavbar" | "standalone";
  endContent?: ReactNode;
  className?: string;
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
  description,
  backHref,
  backLabel,
  backFallbackHref = "/",
  showHome,
  variant = "withNavbar",
  endContent,
  className = "",
}: Props) {
  const router = useRouter();
  const { t } = useTranslations();
  const backText = backLabel ?? t("common.goBack");
  const showHomeButton = showHome ?? variant === "standalone";

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push(backFallbackHref);
  };

  const backClass =
    variant === "withNavbar"
      ? "inline-flex items-center gap-1.5 text-sm font-medium text-xiio-muted hover:text-white transition"
      : "inline-flex items-center gap-1.5 min-h-[44px] py-2 pr-2 text-base font-medium text-white hover:text-xiio-accent transition";

  const backControl = backHref ? (
    <Link href={backHref} className={backClass}>
      <span aria-hidden>←</span>
      <span>{backText}</span>
    </Link>
  ) : (
    <button type="button" onClick={handleBack} className={backClass}>
      <span aria-hidden>←</span>
      <span>{backText}</span>
    </button>
  );

  const homeControl = showHomeButton ? (
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

  if (variant === "withNavbar") {
    return (
      <header className={`mb-8 md:mb-10 ${className}`.trim()}>
        {backControl}
        {title ? (
          <h1 className="mt-4 text-3xl md:text-4xl font-black text-white tracking-tight">{title}</h1>
        ) : null}
        {description ? (
          <p className="mt-2 text-sm md:text-base text-xiio-muted max-w-2xl leading-relaxed">{description}</p>
        ) : null}
      </header>
    );
  }

  return (
    <header className="mb-6 md:mb-8">
      <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
        <XiioLogoLink />
        {endContent}
      </div>
      <div className="flex items-center gap-2 border-b border-white/10 mb-4 pb-2">
        <div className="flex-1 min-w-0">{backControl}</div>
        <div className="flex shrink-0 items-center gap-2">{homeControl}</div>
      </div>
      {title ? <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">{title}</h1> : null}
      {description ? (
        <p className="mt-2 text-sm text-xiio-muted max-w-2xl leading-relaxed">{description}</p>
      ) : null}
    </header>
  );
}
