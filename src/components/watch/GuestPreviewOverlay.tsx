"use client";

import Link from "next/link";
import { useTranslations } from "@/context/LocaleContext";

type Props = {
  loginHref?: string;
  signupHref?: string;
};

export default function GuestPreviewOverlay({
  loginHref = "/login",
  signupHref = "/signup",
}: Props) {
  const { t } = useTranslations();

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/75 backdrop-blur-sm px-6">
      <div className="max-w-md text-center">
        <h2 className="text-lg font-semibold text-white mb-2">{t("watch.guestPreviewTitle")}</h2>
        <p className="text-sm text-xiio-muted mb-6 leading-relaxed">{t("watch.guestPreviewLead")}</p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href={loginHref}
            className="inline-flex justify-center px-5 py-2.5 rounded-lg bg-xiio-accent hover:bg-xiio-accent-hover text-white text-sm font-semibold transition"
          >
            {t("watch.guestPreviewLogin")}
          </Link>
          <Link
            href={signupHref}
            className="inline-flex justify-center px-5 py-2.5 rounded-lg border border-white/25 text-white text-sm font-medium hover:bg-white/10 transition"
          >
            {t("watch.guestPreviewSignup")}
          </Link>
        </div>
      </div>
    </div>
  );
}
