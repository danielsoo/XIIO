"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PeopleProfileActions from "@/components/profile/PeopleProfileActions";
import {
  useProfessionalProfileSave,
  type ProfessionalProfileSaved,
} from "@/hooks/useProfessionalProfileSave";
import { profileInitials, profileInputClass } from "@/lib/profileFormStyles";
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
  editable?: boolean;
  isSelf?: boolean;
  isFollowing?: boolean;
  submissionBadge?: string;
  shareTitle?: string;
  onProfileSaved?: (saved: ProfessionalProfileSaved) => void;
};

export default function PublicProfileCard({
  className = "",
  profile,
  editable = false,
  isSelf = false,
  isFollowing = false,
  submissionBadge,
  shareTitle,
  onProfileSaved,
}: Props) {
  const { t } = useTranslations();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const { fields, applyFields, save, busy, err, msg, clearMessages } = useProfessionalProfileSave();

  const viewHandle = profile.handle;
  const viewHeadline = profile.headline;
  const viewBio = profile.bio;
  const viewOpen = profile.openToCollaborate;
  const viewNote = profile.collaborationNote;

  useEffect(() => {
    if (!editing) return;
    applyFields({
      handle: profile.handle,
      headline: profile.headline ?? "",
      bio: profile.bio ?? "",
      openToCollaborate: profile.openToCollaborate === true,
      collaborationNote: profile.collaborationNote ?? "",
    });
    clearMessages();
  }, [
    editing,
    profile.handle,
    profile.headline,
    profile.bio,
    profile.openToCollaborate,
    profile.collaborationNote,
    applyFields,
    clearMessages,
  ]);

  const startEdit = () => {
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    clearMessages();
  };

  const handleSave = async () => {
    const saved = await save();
    if (!saved) return;
    setEditing(false);
    onProfileSaved?.(saved);
    const newHandle = saved.handle?.trim();
    if (newHandle && newHandle !== profile.handle) {
      router.replace(`/people/${encodeURIComponent(newHandle)}`);
    }
  };

  const btnOutline =
    "px-4 py-2 rounded-lg text-sm font-medium border border-white/20 text-white hover:bg-white/5 disabled:opacity-40";

  return (
    <section
      className={`bg-xiio-surface rounded-2xl p-6 border border-white/10 ${className}`.trim()}
    >
      {submissionBadge && (
        <p className="text-xs text-xiio-muted mb-4 uppercase tracking-wide">{submissionBadge}</p>
      )}
      {shareTitle && <p className="text-sm text-white/70 mb-4">{shareTitle}</p>}

      <div className="flex flex-col sm:flex-row gap-5 sm:gap-6">
        <div
          className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-full bg-xiio-accent/20 ring-2 ring-xiio-accent/40 flex items-center justify-center text-2xl sm:text-3xl font-bold text-white"
          aria-hidden
        >
          {profileInitials(profile.displayName)}
        </div>

        <div className="min-w-0 flex-1">
          {editing ? (
            <div className="space-y-3">
              <p className="text-2xl font-bold text-white">{profile.displayName}</p>
              <div>
                <label className="block text-xs text-xiio-muted mb-1">{t("profile.edit.handle")}</label>
                <input
                  type="text"
                  value={fields.handle}
                  onChange={(e) => applyFields({ handle: e.target.value.replace(/^@/, "") })}
                  placeholder="your_name"
                  className={profileInputClass}
                />
              </div>
              <div>
                <label className="block text-xs text-xiio-muted mb-1">{t("profile.edit.headline")}</label>
                <input
                  type="text"
                  value={fields.headline}
                  onChange={(e) => applyFields({ headline: e.target.value })}
                  placeholder={t("profile.edit.headlinePlaceholder")}
                  className={profileInputClass}
                />
              </div>
              <div>
                <label className="block text-xs text-xiio-muted mb-1">{t("profile.edit.bio")}</label>
                <textarea
                  value={fields.bio}
                  onChange={(e) => applyFields({ bio: e.target.value })}
                  rows={5}
                  placeholder={t("profile.edit.bioPlaceholder")}
                  className={profileInputClass}
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-white">
                <input
                  type="checkbox"
                  checked={fields.openToCollaborate}
                  onChange={(e) => applyFields({ openToCollaborate: e.target.checked })}
                />
                {t("profile.edit.openToCollaborate")}
              </label>
              {fields.openToCollaborate && (
                <input
                  type="text"
                  value={fields.collaborationNote}
                  onChange={(e) => applyFields({ collaborationNote: e.target.value })}
                  placeholder={t("profile.edit.collaborationNotePlaceholder")}
                  className={profileInputClass}
                />
              )}
            </div>
          ) : (
            <>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">{profile.displayName}</h1>
              <p className="text-sm text-xiio-accent mt-1">@{viewHandle}</p>
              {viewHeadline && <p className="text-white/80 mt-2 text-lg">{viewHeadline}</p>}
              {viewOpen && (
                <p className="mt-3 text-sm text-emerald-300/90">
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
              {viewBio && (
                <p className="text-xiio-muted mt-3 text-sm leading-relaxed whitespace-pre-wrap">
                  {viewBio}
                </p>
              )}
            </>
          )}

          {err && <p className="text-red-400 text-sm mt-3">{err}</p>}
          {msg && !editing && <p className="text-emerald-400 text-sm mt-3">{msg}</p>}

          <div className="flex flex-wrap gap-2 mt-4">
            {editable && isSelf && !editing && (
              <button
                type="button"
                onClick={startEdit}
                className="px-4 py-2 rounded-lg bg-xiio-accent text-white text-sm font-medium"
              >
                {t("profile.edit.editProfile")}
              </button>
            )}
            {editable && isSelf && editing && (
              <>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void handleSave()}
                  className="px-4 py-2 rounded-lg bg-xiio-accent text-white text-sm font-medium disabled:opacity-40"
                >
                  {t("profile.edit.save")}
                </button>
                <button type="button" disabled={busy} onClick={cancelEdit} className={btnOutline}>
                  {t("profile.edit.cancel")}
                </button>
              </>
            )}
            {!isSelf && profile.uid && (
              <PeopleProfileActions
                profileUid={profile.uid}
                handle={profile.handle}
                isSelf={false}
                initialFollowing={isFollowing}
              />
            )}
          </div>

          {editable && isSelf && !editing && (
            <p className="text-xs text-xiio-muted mt-3">
              <Link href="/account?tab=profile" className="text-xiio-accent hover:underline">
                {t("profile.edit.accountSettingsLink")}
              </Link>
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
