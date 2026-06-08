"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import SocietyBannerPicker from "@/components/society/SocietyBannerPicker";
import SocietyProfileHeroLayout from "@/components/society/SocietyProfileHeroLayout";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/context/LocaleContext";
import { formatCompactStat } from "@/lib/formatStat";
import type { HeroBackgroundId } from "@/lib/heroBackgroundPresets";
import {
  DEFAULT_SOCIETY_BANNER_ID,
  parseSocietyBannerBackgroundId,
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
    <header className="mb-8 px-4 pt-6 lg:px-0">
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
    return <FallbackHeader />;
  }

  const title = data?.handle || data?.displayName || user.displayName || "—";
  const tagline =
    data?.headline || (data?.bio ? data.bio.split("\n")[0]?.trim() : null);

  const stats = data
    ? [
        { value: formatCompactStat(data.stories), label: t("society.hero.statStories") },
        { value: formatCompactStat(data.followers), label: t("society.hero.statFollowers") },
        { value: formatCompactStat(data.following), label: t("society.hero.statFollowing") },
        { value: formatCompactStat(data.totalViews), label: t("society.hero.statTotalViews") },
      ]
    : [];

  return (
    <SocietyProfileHeroLayout
      title={title}
      displayName={data?.displayName ?? title}
      tagline={tagline}
      avatarUrl={data?.avatarUrl ?? null}
      schoolName={data?.schoolName ?? null}
      profileLink={data?.profileLink ?? null}
      societyBannerBackgroundId={data?.societyBannerBackgroundId ?? DEFAULT_SOCIETY_BANNER_ID}
      stats={stats}
      loading={loading}
      toolbar={
        <Link
          href="/account?tab=profile&section=about"
          className="inline-flex items-center gap-1.5 rounded-full border border-white/25 px-3 py-1.5 text-sm font-medium text-white/85 transition hover:border-white/40 hover:bg-white/5"
        >
          <EditIcon className="h-3.5 w-3.5" />
          {t("society.hero.editProfile")}
        </Link>
      }
      bannerOverlay={
        data ? (
          <SocietyBannerPicker
            value={data.societyBannerBackgroundId}
            onChange={(id) =>
              setData((prev) => (prev ? { ...prev, societyBannerBackgroundId: id } : prev))
            }
          />
        ) : null
      }
    />
  );
}
