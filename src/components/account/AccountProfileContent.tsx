"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/context/LocaleContext";
import { getUserProfile } from "@/lib/userProfile";
import { formatApiError, formatClientError, readResponseJson } from "@/lib/clientErrors";
import type { AccountActivityItem } from "@/types/account-activity";
import type { UserProfileDoc } from "@/types/user";
import AccountUploadsList from "@/components/account/AccountUploadsList";
import AccountWorkActivityList from "@/components/account/AccountWorkActivityList";

type TabId = "uploads" | "likes" | "watched";

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <p className="flex flex-wrap gap-x-2 text-sm">
      <span className="text-xiio-muted shrink-0">{label}:</span>
      <span className="text-white">{value}</span>
    </p>
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
      const [likesRes, histRes] = await Promise.all([
        fetch("/api/me/liked-promos", { headers }),
        fetch("/api/me/watch-history", { headers }),
      ]);
      const likesJson = await readResponseJson<{ items?: AccountActivityItem[]; message?: string }>(
        likesRes
      );
      const histJson = await readResponseJson<{ items?: AccountActivityItem[]; message?: string }>(
        histRes
      );
      if (!likesRes.ok) {
        setActivityErr(formatApiError(t, likesRes.status, likesJson.data));
        return;
      }
      if (!histRes.ok) {
        setActivityErr(formatApiError(t, histRes.status, histJson.data));
        return;
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

  const tabs: { id: TabId; labelKey: string }[] = [
    { id: "uploads", labelKey: "accountProfile.tabUploads" },
    { id: "likes", labelKey: "accountProfile.tabLikes" },
    { id: "watched", labelKey: "accountProfile.tabWatched" },
  ];

  if (loading) {
    return <p className="text-xiio-muted">{t("common.loading")}</p>;
  }

  if (err || !profile) {
    return <p className="text-red-400 text-sm">{err ?? t("accountProfile.noProfile")}</p>;
  }

  const pendingReq = profile.directorNameChangeRequest?.status === "pending";

  return (
    <div className="space-y-6">
      <section className="bg-xiio-surface rounded-2xl p-6 border border-white/10 space-y-3">
        <h2 className="text-sm font-semibold text-xiio-muted">{t("accountProfile.infoSection")}</h2>
        <InfoRow label={t("accountProfile.displayName")} value={profile.displayName || "—"} />
        <InfoRow label={t("accountProfile.email")} value={user?.email ?? "—"} />
        <InfoRow
          label={t("accountProfile.emailVerified")}
          value={
            profile.emailVerified || user?.emailVerified
              ? t("settings.emailVerified")
              : t("settings.emailNotVerified")
          }
        />
        <InfoRow
          label={t("accountProfile.purpose")}
          value={t(`admin.userProfile.purpose.${profile.platformPurpose}`)}
        />
        {profile.age != null && profile.age >= 1 && (
          <InfoRow label={t("accountProfile.age")} value={String(profile.age)} />
        )}
        {profile.createdAt != null && (
          <InfoRow label={t("accountProfile.joinedAt")} value={formatDateTime(profile.createdAt)} />
        )}
        {profile.defaultDirectorName && (
          <InfoRow label={t("accountProfile.directorName")} value={profile.defaultDirectorName} />
        )}
        {pendingReq && profile.directorNameChangeRequest && (
          <p className="text-xs text-amber-400/90">
            {t("accountProfile.directorChangePending", {
              name: profile.directorNameChangeRequest.requestedName,
            })}
          </p>
        )}
        <div className="flex flex-wrap gap-4 pt-2 text-sm">
          <Link href="/profiles" className="text-xiio-accent hover:underline">
            {t("accountProfile.linkWatchProfiles")}
          </Link>
          <Link href="/settings" className="text-xiio-accent hover:underline">
            {t("accountProfile.linkSettings")}
          </Link>
        </div>
      </section>

      <section className="bg-xiio-surface rounded-2xl p-6 border border-white/10">
        <div className="flex flex-wrap gap-2 mb-4 border-b border-white/10 pb-3">
          {tabs.map(({ id, labelKey }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                tab === id
                  ? "bg-xiio-accent text-white"
                  : "text-xiio-muted hover:text-white hover:bg-white/5"
              }`}
            >
              {t(labelKey)}
            </button>
          ))}
        </div>

        {activityErr && tab !== "uploads" && (
          <p className="text-sm text-red-400 mb-3">{activityErr}</p>
        )}

        {tab === "uploads" && <AccountUploadsList />}

        {tab === "likes" && (
          activityLoading ? (
            <p className="text-sm text-xiio-muted">{t("common.loading")}</p>
          ) : (
            <>
              <p className="text-xs text-xiio-muted mb-3">{t("accountProfile.likesNote")}</p>
              <AccountWorkActivityList
                items={likes}
                emptyMessage={t("accountProfile.likesEmpty")}
              />
            </>
          )
        )}

        {tab === "watched" && (
          activityLoading ? (
            <p className="text-sm text-xiio-muted">{t("common.loading")}</p>
          ) : (
            <AccountWorkActivityList
              items={watched}
              emptyMessage={t("accountProfile.watchedEmpty")}
              showTarget
            />
          )
        )}
      </section>
    </div>
  );
}
