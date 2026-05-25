"use client";

import Link from "next/link";
import { useTranslations } from "@/context/LocaleContext";
import type { UserProfileDoc } from "@/types/user";
import type { PlatformPurpose } from "@/types/user";

function initials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

function Badge({ children, variant = "default" }: { children: React.ReactNode; variant?: "default" | "accent" | "warn" }) {
  const cls =
    variant === "accent"
      ? "bg-xiio-accent/20 text-xiio-accent border-xiio-accent/30"
      : variant === "warn"
        ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
        : "bg-white/5 text-xiio-muted border-white/15";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs border ${cls}`}>
      {children}
    </span>
  );
}

type Props = {
  profile: UserProfileDoc;
  email: string | null;
};

export default function AccountProfileHero({ profile, email }: Props) {
  const { t } = useTranslations();
  const verified = profile.emailVerified;
  const pendingReq = profile.directorNameChangeRequest?.status === "pending";
  const showUpload =
    profile.platformPurpose === "upload" || profile.platformPurpose === "both";

  const quickBtn =
    "inline-flex items-center justify-center px-3 py-2 rounded-lg text-sm font-medium border border-white/20 text-white hover:bg-white/5 transition";

  return (
    <section className="bg-xiio-surface rounded-2xl p-6 border border-white/10">
      <div className="flex flex-col sm:flex-row gap-5 sm:gap-6">
        <div
          className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-full bg-xiio-accent/20 ring-2 ring-xiio-accent/40 flex items-center justify-center text-2xl sm:text-3xl font-bold text-white"
          aria-hidden
        >
          {initials(profile.displayName || "?")}
        </div>

        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold text-white truncate">{profile.displayName || "—"}</h1>
          {profile.handle && (
            <Link
              href={`/people/${profile.handle}`}
              className="text-sm text-xiio-accent hover:underline mt-1 inline-block"
            >
              @{profile.handle}
            </Link>
          )}
          {email && <p className="text-sm text-xiio-muted mt-1 truncate">{email}</p>}

          <div className="flex flex-wrap gap-2 mt-3">
            <Badge variant={verified ? "accent" : "warn"}>
              {verified ? t("settings.emailVerified") : t("settings.emailNotVerified")}
            </Badge>
            <Badge>
              {t(`admin.userProfile.purpose.${profile.platformPurpose as PlatformPurpose}`)}
            </Badge>
            {profile.defaultDirectorName && (
              <Badge variant="accent">
                {t("accountProfile.directorName")}: {profile.defaultDirectorName}
              </Badge>
            )}
            {pendingReq && profile.directorNameChangeRequest && (
              <Badge variant="warn">
                {t("accountProfile.directorChangePending", {
                  name: profile.directorNameChangeRequest.requestedName,
                })}
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            <Link href="/profiles" className={quickBtn}>
              {t("accountProfile.linkWatchProfiles")}
            </Link>
            <Link href="/settings" className={quickBtn}>
              {t("accountProfile.linkSettings")}
            </Link>
            {showUpload && (
              <Link
                href="/uploader/upload"
                className="inline-flex items-center justify-center px-3 py-2 rounded-lg text-sm font-medium bg-xiio-accent hover:bg-xiio-accent-hover text-white transition"
              >
                {t("accountProfile.quickUpload")}
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
