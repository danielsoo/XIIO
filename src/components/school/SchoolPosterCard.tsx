"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslations } from "@/context/LocaleContext";
import { MOCKUP_HOME } from "@/lib/mockupHomeSpec";
import { schoolPosterGradient } from "@/lib/school-brand";
import type { SchoolListItem } from "@/types/school";

export default function SchoolPosterCard({ school }: { school: SchoolListItem }) {
  const { t } = useTranslations();
  const [logoFailed, setLogoFailed] = useState(false);

  useEffect(() => {
    setLogoFailed(false);
  }, [school.logoUrl]);

  const showLogo = Boolean(school.logoUrl) && !logoFailed;

  return (
    <Link
      href={`/school/${school.id}`}
      className={`group relative block ${MOCKUP_HOME.cardRadius} overflow-hidden aspect-video border border-white/[0.08] hover:border-white/20 transition`}
    >
      {showLogo ? (
        <>
          <div className="absolute inset-0 bg-black/40" />
          <Image
            src={school.logoUrl!}
            alt=""
            fill
            className="object-contain p-6"
            sizes="(max-width: 768px) 50vw, 25vw"
            unoptimized
            onError={() => setLogoFailed(true)}
          />
        </>
      ) : (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ background: schoolPosterGradient(school.colorPrimary, school.colorSecondary) }}
        >
          <span className="text-5xl font-black text-white/90">{school.initials}</span>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-3">
        <p className="font-semibold text-white text-sm truncate">{school.name}</p>
        <p className="text-[11px] text-white/55">{t("schools.workCount", { count: school.workCount ?? 0 })}</p>
      </div>
    </Link>
  );
}
