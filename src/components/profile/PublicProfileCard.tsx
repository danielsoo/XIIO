"use client";

import PeopleProfileActions from "@/components/profile/PeopleProfileActions";
import { profileInitials } from "@/lib/profileFormStyles";
import { useTranslations } from "@/context/LocaleContext";

export type PublicProfileData = {
  uid?: string;
  handle: string;
  displayName: string;
  headline?: string;
  bio?: string;
  openToCollaborate?: boolean;
  collaborationNote?: string;
  followerCount?: number;
  followingCount?: number;
};

type Props = {
  className?: string;
  profile: PublicProfileData;
  isSelf?: boolean;
  isFollowing?: boolean;
  submissionBadge?: string;
  shareTitle?: string;
};

export default function PublicProfileCard({
  className = "",
  profile,
  isSelf = false,
  isFollowing = false,
  submissionBadge,
  shareTitle,
}: Props) {
  const { t } = useTranslations();

  const viewHandle = profile.handle;
  const viewHeadline = profile.headline;
  const viewBio = profile.bio;
  const viewOpen = profile.openToCollaborate;
  const viewNote = profile.collaborationNote;

  return (
    <section
      className={`bg-xiio-surface rounded-2xl border border-white/10 overflow-hidden ${className}`.trim()}
    >
      <div className="p-6 sm:p-8">
        {submissionBadge && (
          <p className="text-xs text-xiio-muted mb-3 uppercase tracking-wide">{submissionBadge}</p>
        )}
        {shareTitle && <p className="text-sm text-white/70 mb-4">{shareTitle}</p>}

        <div className="flex flex-col sm:flex-row gap-5 sm:gap-8 sm:items-start">
          <div
            className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 rounded-full bg-xiio-accent/20 ring-2 ring-xiio-accent/40 flex items-center justify-center text-3xl font-bold text-white mx-auto sm:mx-0"
            aria-hidden
          >
            {profileInitials(profile.displayName)}
          </div>

          <div className="min-w-0 flex-1 text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold text-white">{profile.displayName}</h1>
            {viewHandle && <p className="text-sm text-xiio-accent mt-1">@{viewHandle}</p>}
            {viewHeadline && <p className="text-white/80 mt-2 text-base sm:text-lg">{viewHeadline}</p>}
            {viewOpen && (
              <p className="mt-2 text-sm text-emerald-300/90">
                {t("discover.openBadge")}
                {viewNote ? ` — ${viewNote}` : ""}
              </p>
            )}
            <p className="text-xs text-xiio-muted mt-2">
              {t("follow.counts", {
                followers: profile.followerCount ?? 0,
                following: profile.followingCount ?? 0,
              })}
            </p>

            {!isSelf && profile.uid && (
              <div className="flex flex-wrap gap-2 mt-4 justify-center sm:justify-start">
                <PeopleProfileActions
                  profileUid={profile.uid}
                  handle={profile.handle}
                  isSelf={false}
                  initialFollowing={isFollowing}
                />
              </div>
            )}
          </div>
        </div>

        {viewBio && (
          <p className="text-xiio-muted mt-6 pt-6 border-t border-white/10 text-sm leading-relaxed whitespace-pre-wrap">
            {viewBio}
          </p>
        )}
      </div>
    </section>
  );
}
