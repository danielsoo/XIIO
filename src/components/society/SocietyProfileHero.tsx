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
  societyBannerBackgroundId: HeroBackgroundId;
  stories: number;
  followers: number;
  following: number;
  totalViews: number;
};

function StatCell({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col gap-0.5 px-4 first:pl-0 sm:px-6">
      <span className="text-lg font-semibold tabular-nums text-white sm:text-xl">{value}</span>
      <span className="text-xs text-white/45 sm:text-sm">{label}</span>
    </div>
  );
}

function StatDivider() {
  return <div className="hidden h-10 w-px shrink-0 bg-white/15 sm:block" aria-hidden />;
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
    return <FallbackHeader />;
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
      className="relative mb-8 min-h-[200px] overflow-hidden rounded-2xl border border-white/10 sm:min-h-[220px] sm:mb-10"
      aria-busy={loading}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#0a1628] via-[#060a12] to-black"
        aria-hidden
      />

      <div className="pointer-events-none absolute inset-y-0 right-0 w-[55%] sm:w-[48%]" aria-hidden>
        <Image
          src={bannerPreset.src}
          alt=""
          fill
          className="object-cover opacity-90"
          style={{ objectPosition: bannerPreset.objectPosition }}
          sizes="(max-width: 768px) 55vw, 48vw"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#060a12] via-[#060a12]/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
      </div>

      {data ? (
        <SocietyBannerPicker
          value={data.societyBannerBackgroundId}
          onChange={(id) =>
            setData((prev) => (prev ? { ...prev, societyBannerBackgroundId: id } : prev))
          }
        />
      ) : null}

      <div className="relative z-10 flex min-h-[200px] flex-col justify-between p-5 sm:min-h-[220px] sm:p-6 md:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
          <ProfileAvatar
            displayName={data?.displayName ?? title}
            avatarUrl={data?.avatarUrl}
            className="mx-auto h-20 w-20 shrink-0 overflow-hidden rounded-full bg-xiio-accent/20 ring-2 ring-white/20 sm:mx-0 sm:h-24 sm:w-24 flex items-center justify-center text-2xl font-bold text-white"
          />

          <div className="min-w-0 flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start sm:gap-3">
              <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl md:text-3xl">
                {loading && !data ? "…" : title}
              </h1>
              <Link
                href="/account?tab=profile&section=about"
                className="inline-flex items-center gap-1.5 rounded-full border border-white/20 px-3 py-1 text-xs font-medium text-white/80 transition hover:border-white/35 hover:bg-white/5 sm:text-sm"
              >
                <EditIcon className="h-3.5 w-3.5" />
                {t("society.hero.editProfile")}
              </Link>
            </div>

            {tagline ? (
              <p className="mt-2 text-sm text-white/70 sm:text-base">{tagline}</p>
            ) : loading ? (
              <p className="mt-2 text-sm text-white/30">{t("common.loading")}</p>
            ) : null}

            {data?.schoolName ? (
              <p className="mt-2 flex items-center justify-center gap-1.5 text-sm text-white/50 sm:justify-start">
                <SchoolIcon className="h-4 w-4 shrink-0" />
                <span>{data.schoolName}</span>
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-y-3 sm:mt-8 sm:justify-start">
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
