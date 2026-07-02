"use client";

import Link from "next/link";
import AppPageShell from "@/components/layout/AppPageShell";
import SubpageHeader from "@/components/layout/SubpageHeader";
import AdminHomeColorPicker from "@/components/home/AdminHomeColorPicker";
import { useTranslations } from "@/context/LocaleContext";
import { rgba } from "@/lib/campusBrandColors";
import type { SchoolListItem } from "@/types/school";

function SchoolBadge({ school, size = 56 }: { school: SchoolListItem; size?: number }) {
  if (school.logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={school.logoUrl}
        alt={school.name}
        width={size}
        height={size}
        className="rounded-full object-contain bg-white/5 shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="shrink-0 rounded-full flex items-center justify-center font-black text-white"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.32,
        backgroundColor: rgba(school.colorPrimary, 0.25),
        border: `2px solid ${rgba(school.colorPrimary, 0.6)}`,
      }}
    >
      {school.initials}
    </div>
  );
}

export default function SchoolsDirectoryPage({ schools }: { schools: SchoolListItem[] }) {
  const { t } = useTranslations();

  return (
    <AppPageShell>
      <SubpageHeader
        title={t("schools.directoryTitle")}
        description={t("schools.directorySubtitle")}
        backFallbackHref="/"
        showHome
      />

      {schools.length === 0 ? (
        <p className="text-xiio-muted py-16 text-center">{t("schools.empty")}</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {schools.map((school) => (
            <Link
              key={school.id}
              href={`/school/${school.id}`}
              className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5 hover:border-white/25 hover:bg-white/[0.06] transition text-center"
            >
              <SchoolBadge school={school} />
              <div className="min-w-0">
                <p className="text-sm font-bold text-white truncate max-w-[10rem]">{school.name}</p>
                <p className="mt-1 text-xs text-xiio-muted">
                  {t("schools.workCount", { count: school.workCount ?? 0 })}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      <AdminHomeColorPicker />
    </AppPageShell>
  );
}
