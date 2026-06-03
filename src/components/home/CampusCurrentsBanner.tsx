"use client";

import Image from "next/image";
import Link from "next/link";
import { IconArrowRight } from "@/components/icons/MockupIcons";
import { CAMPUS_CURRENTS_MAP } from "@/lib/homeMockData";
import { MOCKUP_HOME } from "@/lib/mockupHomeSpec";
import { useTranslations } from "@/context/LocaleContext";

export default function CampusCurrentsBanner() {
  const { t } = useTranslations();

  return (
    <Link
      href="/school-battle"
      className={`relative shrink-0 w-full ${MOCKUP_HOME.campusBannerWidth} ${MOCKUP_HOME.campusBannerMinH} rounded-xl overflow-hidden border border-white/[0.08] hover:border-sky-500/25 transition group`}
    >
      <Image
        src={CAMPUS_CURRENTS_MAP}
        alt=""
        fill
        className="object-cover object-right"
        sizes="380px"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#05070A] via-[#05070A]/85 to-transparent" />
      <div className="relative z-10 p-5 flex flex-col justify-end min-h-[190px] h-full">
        <p className="text-[11px] font-semibold tracking-wide text-sky-400 mb-1.5">
          {t("home.mock.campusBannerTitle")}
        </p>
        <p className="text-sm text-white/70 leading-relaxed mb-4 max-w-[220px]">
          {t("home.mock.campusBannerBody")}
        </p>
        <span className="inline-flex items-center gap-1 text-sm text-sky-400 font-medium group-hover:text-sky-300">
          {t("home.mock.exploreBattles")}
          <IconArrowRight className="w-3.5 h-3.5" />
        </span>
        <div className="absolute bottom-5 right-5 flex -space-x-2">
          {["PS", "NY", "LA"].map((l) => (
            <span
              key={l}
              className="w-8 h-8 rounded-full bg-white/10 border-2 border-[#05070A] flex items-center justify-center text-[9px] font-bold text-white/70"
            >
              {l}
            </span>
          ))}
          <span className="w-8 h-8 rounded-full bg-sky-500/25 border-2 border-[#05070A] flex items-center justify-center text-[10px] font-semibold text-sky-300">
            +12
          </span>
        </div>
      </div>
    </Link>
  );
}
