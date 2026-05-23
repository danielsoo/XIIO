"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/context/LocaleContext";
import { getUserProfile } from "@/lib/userProfile";
import { formatApiError, formatClientError, readResponseJson } from "@/lib/clientErrors";
import type { AccountActivityItem } from "@/types/account-activity";
import type { UserProfileDoc } from "@/types/user";
import AccountProfileHero from "@/components/account/AccountProfileHero";
import AccountUploadsList from "@/components/account/AccountUploadsList";
import AccountWorkActivityList from "@/components/account/AccountWorkActivityList";

type TabId = "uploads" | "likes" | "watched";

function MetaField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-xiio-muted">{label}</dt>
      <dd className="text-sm text-white mt-0.5">{value}</dd>
    </div>
  );
}

export default function AccountProfileContent() {
  const { user } = useAuth();
  const { t, formatDateTime } = useTranslations();
  const [profile, setProfile] = useState<UserProfileDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [tab, setTab] = useState<TabId>("uploads");
  const [likes, setLikes] = useState<AccountActivityItem[]>([]);
  const [watched, setWatched] = useState<AccountActivityItem[]>([]);
  const [uploadCount, setUploadCount] = useState(0);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityErr, setActivityErr] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setErr(null);
    void getUserProfile(user.uid).then((p) => {
      if (cancelled) return;
      setProfile(p);
      setLoading(false);
      if (!p) setErr(t("accountProfile.noProfile"));
    });
    return () => {
      cancelled = true;
    };
  }, [user, t]);

  const loadActivity = useCallback(async () => {
    if (!user) return;
    setActivityLoading(true);
    setActivityErr(null);
    try {
      const token = await user.getIdToken();
      const headers = { Authorization: `Bearer ${token}` };
      const [worksRes, likesRes, histRes] = await Promise.all([
        fetch("/api/me/works", { headers }),
        fetch("/api/me/liked-promos", { headers }),
        fetch("/api/me/watch-history", { headers }),
      ]);
      const worksJson = await readResponseJson<{ works?: unknown[] }>(worksRes);
      const likesJson = await readResponseJson<{ items?: AccountActivityItem[] }>(likesRes);
      const histJson = await readResponseJson<{ items?: AccountActivityItem[] }>(histRes);
      if (!likesRes.ok) {
        setActivityErr(
          formatApiError(t, likesRes.status, {
            ...likesJson.data,
            message: (likesJson.data as { message?: string }).message,
          })
        );
        return;
      }
      if (!histRes.ok) {
        setActivityErr(
          formatApiError(t, histRes.status, {
            ...histJson.data,
            message: (histJson.data as { message?: string }).message,
          })
        );
        return;
      }
      if (worksRes.ok) {
        setUploadCount(worksJson.data.works?.length ?? 0);
      }
      setLikes(likesJson.data.items ?? []);
      setWatched(histJson.data.items ?? []);
    } catch (e) {
      setActivityErr(formatClientError(t, e, { titleKey: "accountProfile.loadActivityFailed" }));
    } finally {
      setActivityLoading(false);
    }
  }, [user, t]);

  useEffect(() => {
    void loadActivity();
  }, [loadActivity]);

  const tabs: { id: TabId; labelKey: string; count?: number }[] = [
    { id: "uploads", labelKey: "accountProfile.tabUploads", count: uploadCount },
    { id: "likes", labelKey: "accountProfile.tabLikes", count: likes.length },
    { id: "watched", labelKey: "accountProfile.tabWatched", count: watched.length },
  ];

  if (loading) {
    return <p className="text-xiio-muted py-8 text-center">{t("common.loading")}</p>;
  }

  if (err || !profile) {
    return <p className="text-red-400 text-sm">{err ?? t("accountProfile.noProfile")}</p>;
  }

  const showAge = profile.age != null && profile.age >= 1;
  const showJoined = profile.createdAt != null;

  return (
    <div className="space-y-6">
      <AccountProfileHero profile={profile} email={user?.email ?? null} />

      {(showAge || showJoined) && (
        <section className="bg-xiio-surface rounded-2xl p-5 border border-white/10">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            {showAge && <MetaField label={t("accountProfile.age")} value={String(profile.age)} />}
            {showJoined && (
              <MetaField label={t("accountProfile.joinedAt")} value={formatDateTime(profile.createdAt)} />
            )}
          </dl>
        </section>
      )}

      <section className="bg-xiio-surface rounded-2xl p-5 border border-white/10">
        <div className="flex gap-1 p-1 rounded-xl bg-white/5 border border-white/10 mb-5">
          {tabs.map(({ id, labelKey, count }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition ${
                tab === id
                  ? "bg-xiio-accent text-white shadow-sm"
                  : "text-xiio-muted hover:text-white"
              }`}
            >
              <span>{t(labelKey)}</span>
              {!activityLoading && count !== undefined && count > 0 && (
                <span
                  className={`text-xs tabular-nums px-1.5 py-0.5 rounded-md ${
                    tab === id ? "bg-white/20" : "bg-white/10"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {activityErr && tab !== "uploads" && (
          <p className="text-sm text-red-400 mb-4">{activityErr}</p>
        )}

        {tab === "uploads" && <AccountUploadsList />}

        {tab === "likes" && (
          activityLoading ? (
            <p className="text-sm text-xiio-muted text-center py-8">{t("common.loading")}</p>
          ) : (
            <>
              <p className="text-xs text-xiio-muted mb-3">{t("accountProfile.likesNote")}</p>
              <AccountWorkActivityList
                items={likes}
                emptyMessage={t("accountProfile.likesEmpty")}
                emptyCtaLabel={t("accountProfile.emptyLikesCta")}
                emptyCtaHref="/"
              />
            </>
          )
        )}

        {tab === "watched" && (
          activityLoading ? (
            <p className="text-sm text-xiio-muted text-center py-8">{t("common.loading")}</p>
          ) : (
            <AccountWorkActivityList
              items={watched}
              emptyMessage={t("accountProfile.watchedEmpty")}
              emptyCtaLabel={t("accountProfile.emptyWatchedCta")}
              emptyCtaHref="/movies"
              showTarget
            />
          )
        )}
      </section>
    </div>
  );
}
