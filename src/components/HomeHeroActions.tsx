"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/context/LocaleContext";

export default function HomeHeroActions() {
  const { user, loading } = useAuth();
  const { t } = useTranslations();
  const watchNowHref = user ? "/movies" : "/login";

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
      <Link
        href={watchNowHref}
        className="inline-flex items-center justify-center rounded-full px-8 py-2.5 text-sm font-semibold text-white bg-[#256195] hover:bg-[#2d6fa8] transition"
      >
        {t("home.watchNow")}
      </Link>
      {!loading && !user && (
        <div className="flex flex-wrap gap-3">
          <Link
            href="/signup"
            className="inline-flex justify-center px-6 py-2.5 rounded-full border border-white/30 text-white hover:bg-white/10 transition text-sm font-medium"
          >
            {t("common.signup")}
          </Link>
          <Link
            href="/login"
            className="inline-flex justify-center px-6 py-2.5 rounded-full border border-white/30 text-white/80 hover:bg-white/10 transition text-sm font-medium"
          >
            {t("common.login")}
          </Link>
        </div>
      )}
    </div>
  );
}
