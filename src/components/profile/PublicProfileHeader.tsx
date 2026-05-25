"use client";

import { useTranslations } from "@/context/LocaleContext";

export type PublicProfileHeaderProps = {
  handle: string;
  displayName: string;
  headline?: string;
  bio?: string;
  openToCollaborate?: boolean;
  collaborationNote?: string;
  followerCount?: number;
  followingCount?: number;
  /** /p only — shown above the profile block, not part of profile settings */
  submissionBadge?: string;
  shareTitle?: string;
  actions?: React.ReactNode;
};

export default function PublicProfileHeader({
  handle,
  displayName,
  headline,
  bio,
  openToCollaborate,
  collaborationNote,
  followerCount = 0,
  followingCount = 0,
  submissionBadge,
  shareTitle,
  actions,
}: PublicProfileHeaderProps) {
  const { t } = useTranslations();

  return (
    <header className="mb-8">
      {submissionBadge && (
        <p className="text-xs text-xiio-muted mb-4 uppercase tracking-wide">{submissionBadge}</p>
      )}
      {shareTitle && (
        <p className="text-sm text-white/70 mb-3">{shareTitle}</p>
      )}
      <p className="text-sm text-xiio-accent mb-1">@{handle}</p>
      <h1 className="text-2xl md:text-3xl font-bold text-white">{displayName}</h1>
      {headline && <p className="text-white/80 mt-2 text-lg">{headline}</p>}
      {openToCollaborate && (
        <p className="mt-3 text-sm text-emerald-300/90">
          {t("discover.openBadge")}
          {collaborationNote ? ` — ${collaborationNote}` : ""}
        </p>
      )}
      <p className="text-xs text-xiio-muted mt-2">
        {t("follow.counts", { followers: followerCount, following: followingCount })}
      </p>
      {bio && (
        <p className="text-xiio-muted mt-3 text-sm leading-relaxed whitespace-pre-wrap">{bio}</p>
      )}
      {actions}
    </header>
  );
}
