"use client";

import Link from "next/link";
import SocietyProfileHeroLayout from "@/components/society/SocietyProfileHeroLayout";
import PeopleProfileActions from "@/components/profile/PeopleProfileActions";
import { useTranslations } from "@/context/LocaleContext";
import { formatCompactStat } from "@/lib/formatStat";
import type { HeroBackgroundId } from "@/lib/heroBackgroundPresets";
import { DEFAULT_SOCIETY_BANNER_ID } from "@/lib/societyBannerBackground";

type Props = {
  displayName: string;
  handle: string;
  headline?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  schoolName?: string | null;
  profileLink?: string | null;
  societyBannerBackgroundId?: HeroBackgroundId | null;
  followerCount?: number;
  followingCount?: number;
  stats?: { stories: number; totalViews: number };
  isOnline?: boolean;
  profileUid: string;
  isSelf: boolean;
  isFollowing: boolean;
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

export default function SocietyPublicProfileHero({
  displayName,
  handle,
  headline,
  bio,
  avatarUrl,
  schoolName,
  profileLink,
  societyBannerBackgroundId,
  followerCount = 0,
  followingCount = 0,
  stats,
  isOnline = false,
  profileUid,
  isSelf,
  isFollowing,
}: Props) {
  const { t } = useTranslations();

  const title = handle || displayName;
  const tagline = headline?.trim() || (bio ? bio.split("\n")[0]?.trim() : null) || null;

  const heroStats = [
    { value: formatCompactStat(stats?.stories ?? 0), label: t("society.hero.statStories") },
    { value: formatCompactStat(followerCount), label: t("society.hero.statFollowers") },
    { value: formatCompactStat(followingCount), label: t("society.hero.statFollowing") },
    { value: formatCompactStat(stats?.totalViews ?? 0), label: t("society.hero.statTotalViews") },
  ];

  return (
    <SocietyProfileHeroLayout
      title={title}
      displayName={displayName}
      tagline={tagline}
      avatarUrl={avatarUrl ?? null}
      schoolName={schoolName ?? null}
      profileLink={profileLink ?? null}
      societyBannerBackgroundId={societyBannerBackgroundId ?? DEFAULT_SOCIETY_BANNER_ID}
      stats={heroStats}
      isOnline={isOnline}
      toolbar={
        isSelf ? (
          <Link
            href="/account?tab=profile&section=about"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/25 px-3 py-1.5 text-sm font-medium text-white/85 transition hover:border-white/40 hover:bg-white/5"
          >
            <EditIcon className="h-3.5 w-3.5" />
            {t("society.hero.editProfile")}
          </Link>
        ) : (
          <PeopleProfileActions
            profileUid={profileUid}
            handle={handle}
            isSelf={false}
            initialFollowing={isFollowing}
          />
        )
      }
    />
  );
}
