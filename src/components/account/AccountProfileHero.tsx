"use client";

import Link from "next/link";
import ProfileAvatar from "@/components/profile/ProfileAvatar";
import { useTranslations } from "@/context/LocaleContext";
import type { UserProfileDoc } from "@/types/user";
import type { PlatformPurpose } from "@/types/user";

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

export type AccountProfileMetaItem = {
  label: string;
  value: string;
  align?: "start" | "end";
};

function MetaItem({ label, value, align = "start" }: AccountProfileMetaItem) {
  return (
    <div className={align === "end" ? "text-right" : "text-left"}>
      <p className="text-xs text-xiio-muted">{label}</p>
      <p className="text-sm text-white mt-0.5 font-medium tabular-nums">{value}</p>
    </div>
  );
}

type Props = {
  profile: UserProfileDoc;
  email: string | null;
  metaItems?: AccountProfileMetaItem[];
};

export default function AccountProfileHero({ profile, email, metaItems = [] }: Props) {
  const { t } = useTranslations();
  const verified = profile.emailVerified;
  const pendingReq = profile.directorNameChangeRequest?.status === "pending";
  const showUpload =
    profile.platformPurpose === "upload" || profile.platformPurpose === "both";

  const quickBtn =
    "inline-flex items-center justify-center px-3 py-2 rounded-lg text-sm font-medium border border-white/20 text-white hover:bg-white/5 transition";

  const hasMeta = metaItems.length > 0;
  const primaryMeta = metaItems.filter((m) => m.align !== "end");
  const trailingMeta = metaItems.filter((m) => m.align === "end");

  return (
    <section className="bg-xiio-surface rounded-2xl p-6 border border-white/10">
      <div className="flex flex-col lg:flex-row lg:items-stretch gap-6 lg:gap-8">
        <div className="flex flex-col sm:flex-row gap-5 sm:gap-6 min-w-0 flex-1">
          <ProfileAvatar
            displayName={profile.displayName || "?"}
            avatarUrl={profile.avatarUrl}
            className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-full bg-xiio-accent/20 ring-2 ring-xiio-accent/40 flex items-center justify-center text-2xl sm:text-3xl font-bold text-white overflow-hidden mx-auto sm:mx-0"
          />

          <div className="min-w-0 flex-1 text-center sm:text-left">
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

            <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
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

            <div className="flex flex-wrap gap-2 mt-4 justify-center sm:justify-start">
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

        {hasMeta && (
          <aside className="lg:w-56 xl:w-64 shrink-0 flex flex-col justify-center gap-4 lg:border-l lg:border-white/10 lg:pl-8">
            <div className="hidden lg:flex flex-col gap-4 justify-center min-h-full">
              {(primaryMeta.length > 0 || trailingMeta.length > 0) && (
                <div className="flex items-end justify-between gap-6 w-full">
                  <div className="space-y-3">
                    {primaryMeta.map((item) => (
                      <MetaItem key={`${item.label}-${item.value}`} {...item} />
                    ))}
                  </div>
                  {trailingMeta.length > 0 && (
                    <div className="space-y-3">
                      {trailingMeta.map((item) => (
                        <MetaItem key={`${item.label}-${item.value}`} {...item} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="lg:hidden rounded-xl bg-white/[0.03] border border-white/10 px-4 py-3 flex items-end justify-between gap-6">
              <div className="flex flex-col gap-3 min-w-0">
                {primaryMeta.map((item) => (
                  <MetaItem key={`${item.label}-${item.value}`} {...item} />
                ))}
              </div>
              {trailingMeta.length > 0 && (
                <div className="flex flex-col gap-3 shrink-0">
                  {trailingMeta.map((item) => (
                    <MetaItem key={`${item.label}-${item.value}`} {...item} />
                  ))}
                </div>
              )}
            </div>
          </aside>
        )}
      </div>
    </section>
  );
}
