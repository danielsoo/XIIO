"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import SocietyBannerPicker from "@/components/society/SocietyBannerPicker";
import ProfileAvatar from "@/components/profile/ProfileAvatar";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/context/LocaleContext";
import { formatCompactStat } from "@/lib/formatStat";
import type { HeroBackgroundId } from "@/lib/heroBackgroundPresets";
import { displayProfileLink } from "@/lib/profileLink";
import {
  DEFAULT_SOCIETY_BANNER_ID,
  parseSocietyBannerBackgroundId,
  resolveSocietyBannerBackground,
} from "@/lib/societyBannerBackground";
import { getUserProfile } from "@/lib/userProfile";

type HeroData = {
  displayName: string;
  handle: string | null;
  headline: string | null;
  bio: string | null;
  avatarUrl: string | null;
  schoolName: string | null;
  profileLink: string | null;
  societyBannerBackgroundId: HeroBackgroundId;
  stories: number;
  followers: number;
  following: number;
  totalViews: number;
};

function StatCell({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-start gap-0.5 px-5 first:pl-0 sm:px-8">
      <span className="text-xl font-semibold tabular-nums text-white">{value}</span>
      <span className="text-xs text-white/45">{label}</span>
    </div>
  );
}

function StatDivider() {
  return <div className="h-10 w-px shrink-0 bg-white/15" aria-hidden />;
}

function SchoolIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M12 3L2 9l10 6 10-6-10-6zM4 10.5V18a1 1 0 00.553.894L12 22l7.447-3.106A1 1 0 0020 18v-7.5M12 15v7"
      />
    </svg>
  );
}

function LinkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M10 13a5 5 0 007.54.54l2.92-2.92a5 5 0 00-7.07-7.07l-1.17 1.17M14 11a5 5 0 00-7.54-.54L3.54 13.4a5 5 0 007.07 7.07l1.17-1.17"
      />
    </svg>
  );
}

function EditIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M15.232 5.232l3.536 3.536M4 20h4l10.5-10.5a1.5 1.5 0 00-2.12-2.12L5.88 17.88 4 20z"
      />
    </svg>
  );
}

function FallbackHeader() {
  const { t } = useTranslations();
  return (
    <header>
      <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{t("society.title")}</h1>
      <p className="mt-2 max-w-2xl text-sm text-white/50 sm:text-base">{t("society.lead")}</p>
    </header>
  );
}

export default function SocietyProfileHero() {
  const { user } = useAuth();
  const { t } = useTranslations();
  const [data, setData] = useState<HeroData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setData(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const token = await user.getIdToken();
        const headers = { Authorization: `Bearer ${token}` };

        const [profileDoc, proRes, worksRes, analyticsRes] = await Promise.all([
          getUserProfile(user.uid),
          fetch("/api/me/professional-profile", { headers }),
          fetch("/api/me/works", { headers }),
          fetch("/api/me/analytics?days=90", { headers }),
        ]);

        const pro = proRes.ok
          ? ((await proRes.json()) as {
              handle?: string | null;
              headline?: string | null;
              bio?: string | null;
              displayName?: string;
              avatarUrl?: string | null;
              profileLink?: string | null;
              followerCount?: number;
              followingCount?: number;
              societyBannerBackgroundId?: HeroBackgroundId | null;
            })
          : null;

        let stories = 0;
        if (worksRes.ok) {
          const worksBody = (await worksRes.json()) as {
            works?: { platformStatus?: string }[];
          };
          stories = (worksBody.works ?? []).filter((w) => w.platformStatus === "published").length;
        }

        let totalViews = 0;
        if (analyticsRes.ok) {
          const analyticsBody = (await analyticsRes.json()) as {
            summary?: { totalViews?: number };
          };
          totalViews = analyticsBody.summary?.totalViews ?? 0;
        }

        if (cancelled) return;

        const displayName =
          pro?.displayName?.trim() ||
          profileDoc?.displayName?.trim() ||
          user.displayName?.trim() ||
          "—";

        const bannerId =
          parseSocietyBannerBackgroundId(pro?.societyBannerBackgroundId) ??
          parseSocietyBannerBackgroundId(profileDoc?.societyBannerBackgroundId) ??
          DEFAULT_SOCIETY_BANNER_ID;

        setData({
          displayName,
          handle: pro?.handle?.trim() || null,
          headline: pro?.headline?.trim() || null,
          bio: pro?.bio?.trim() || null,
          avatarUrl: pro?.avatarUrl ?? profileDoc?.avatarUrl ?? null,
          schoolName: profileDoc?.schoolName?.trim() || null,
          profileLink: pro?.profileLink ?? profileDoc?.profileLink ?? null,
          societyBannerBackgroundId: bannerId,
          stories,
          followers: pro?.followerCount ?? 0,
          following: pro?.followingCount ?? 0,
          totalViews,
        });
      } catch {
        if (!cancelled) {
          setData({
            displayName: user.displayName?.trim() || "—",
            handle: null,
            headline: null,
            bio: null,
            avatarUrl: null,
            schoolName: null,
            profileLink: null,
            societyBannerBackgroundId: DEFAULT_SOCIETY_BANNER_ID,
            stories: 0,
            followers: 0,
            following: 0,
            totalViews: 0,
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!user) {
    return (
      <div className="mb-8 px-4 pt-6 lg:px-0">
        <FallbackHeader />
      </div>
    );
  }

  const title = data?.handle || data?.displayName || user.displayName || "—";
  const tagline =
    data?.headline ||
    (data?.bio ? data.bio.split("\n")[0]?.trim() : null);

  const bannerPreset = resolveSocietyBannerBackground(data?.societyBannerBackgroundId);

  const stats = data
    ? [
        { value: formatCompactStat(data.stories), label: t("society.hero.statStories") },
        { value: formatCompactStat(data.followers), label: t("society.hero.statFollowers") },
        { value: formatCompactStat(data.following), label: t("society.hero.statFollowing") },
        { value: formatCompactStat(data.totalViews), label: t("society.hero.statTotalViews") },
      ]
    : [];

  return (
    <section
      className="relative isolate mb-8 min-h-[320px] w-full overflow-hidden -mt-[60px] pt-[60px] sm:min-h-[360px] md:min-h-[380px] sm:mb-10"
      aria-busy={loading}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#0a1628] via-[#060a12] to-[#030508]"
        aria-hidden
      />

      <div className="pointer-events-none absolute inset-y-0 right-0 w-[50%]" aria-hidden>
        <Image
          src={bannerPreset.src}
          alt=""
          fill
          className="object-cover opacity-90"
          style={{ objectPosition: bannerPreset.objectPosition }}
          sizes="50vw"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#060a12] via-[#060a12]/75 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
      </div>

      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-b from-transparent to-xiio-bg"
        aria-hidden
      />

      {data ? (
        <SocietyBannerPicker
          value={data.societyBannerBackgroundId}
          onChange={(id) =>
            setData((prev) => (prev ? { ...prev, societyBannerBackgroundId: id } : prev))
          }
        />
      ) : null}

      <div className="relative z-10 flex min-h-[320px] flex-col justify-between p-8 md:p-10 sm:min-h-[360px] md:min-h-[380px]">
        <div className="flex flex-row items-start gap-5 sm:gap-6">
          <ProfileAvatar
            displayName={data?.displayName ?? title}
            avatarUrl={data?.avatarUrl}
            className="h-24 w-24 shrink-0 overflow-hidden rounded-full bg-xiio-accent/20 ring-2 ring-white/20 sm:h-28 sm:w-28 flex items-center justify-center text-2xl font-bold text-white"
          />

          <div className="min-w-0 flex-1 text-left">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                {loading && !data ? "…" : title}
              </h1>
              <Link
                href="/account?tab=profile&section=about"
                className="inline-flex items-center gap-1.5 rounded-full border border-white/25 px-3 py-1.5 text-sm font-medium text-white/85 transition hover:border-white/40 hover:bg-white/5"
              >
                <EditIcon className="h-3.5 w-3.5" />
                {t("society.hero.editProfile")}
              </Link>
            </div>

            {tagline ? (
              <p className="mt-1 text-base text-white/85">{tagline}</p>
            ) : loading ? (
              <p className="mt-1 text-sm text-white/30">{t("common.loading")}</p>
            ) : null}

            {data?.schoolName ? (
              <p className="mt-2 flex items-center gap-1.5 text-sm text-white/50">
                <SchoolIcon className="h-4 w-4 shrink-0" />
                <span>{data.schoolName}</span>
              </p>
            ) : null}

            {data?.profileLink ? (
              <p className="mt-1.5 flex items-center gap-1.5 text-sm">
                <LinkIcon className="h-4 w-4 shrink-0 text-sky-400/80" />
                <a
                  href={data.profileLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sky-400 hover:underline"
                >
                  {displayProfileLink(data.profileLink)}
                </a>
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center border-t border-white/10 pt-5 sm:mt-10">
          {stats.map((stat, i) => (
            <div key={stat.label} className="flex items-center">
              {i > 0 ? <StatDivider /> : null}
              <StatCell value={stat.value} label={stat.label} />
            </div>
          ))}
          {loading && !data ? (
            <p className="text-xs text-white/35">{t("common.loading")}</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
