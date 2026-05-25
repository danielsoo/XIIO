"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/context/LocaleContext";
import { formatBirthDateForDisplay } from "@/lib/userBirthDate";
import { genderLabelKey } from "@/lib/userGender";
import { getUserProfile } from "@/lib/userProfile";
import { LOCALES } from "@/i18n";
import { formatApiError, formatClientError, readResponseJson } from "@/lib/clientErrors";
import type { AccountActivityItem } from "@/types/account-activity";
import type { UserProfileDoc } from "@/types/user";
import AccountProfileHero from "@/components/account/AccountProfileHero";
import AccountUploadsList from "@/components/account/AccountUploadsList";
import AccountWorkActivityList from "@/components/account/AccountWorkActivityList";
import DiscoverBooth from "@/components/account/DiscoverBooth";
import ProProfileEditor from "@/components/profile/ProProfileEditor";
import PortfolioShareSection from "@/components/settings/PortfolioShareSection";

type MainTabId = "activity" | "profile" | "discover";
type ActivityTabId = "uploads" | "likes" | "watched";

const MAIN_TABS: MainTabId[] = ["activity", "profile", "discover"];

function parseMainTab(raw: string | null): MainTabId {
  if (raw === "profile" || raw === "discover") return raw;
  return "activity";
}

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
  const { t, formatDateTime, dateLocale } = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const mainTab = parseMainTab(searchParams.get("tab"));

  const [profile, setProfile] = useState<UserProfileDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [activityTab, setActivityTab] = useState<ActivityTabId>("uploads");
  const [likes, setLikes] = useState<AccountActivityItem[]>([]);
  const [watched, setWatched] = useState<AccountActivityItem[]>([]);
  const [uploadCount, setUploadCount] = useState(0);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityErr, setActivityErr] = useState<string | null>(null);

  const setMainTab = (id: MainTabId) => {
    const params = new URLSearchParams(searchParams.toString());
    if (id === "activity") params.delete("tab");
    else params.set("tab", id);
    const q = params.toString();
    router.replace(q ? `/account?${q}` : "/account", { scroll: false });
  };

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

  const mainTabLabels: Record<MainTabId, string> = {
    activity: t("accountProfile.tabActivity"),
    profile: t("accountProfile.tabProfileSettings"),
    discover: t("accountProfile.tabDiscover"),
  };

  const activityTabs: { id: ActivityTabId; labelKey: string; count?: number }[] = [
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

  const showBirthDate = Boolean(profile.birthDate?.trim());
  const showAge = !showBirthDate && profile.age != null && profile.age >= 1;
  const showGender = Boolean(profile.gender);
  const showJoined = profile.createdAt != null;
  const localeLabel =
    profile.locale === "en"
      ? LOCALES.find((l) => l.code === "en")?.label ?? "English"
      : profile.locale === "ko"
        ? LOCALES.find((l) => l.code === "ko")?.label ?? "한국어"
        : null;

  return (
    <div className="space-y-6">
      <AccountProfileHero profile={profile} email={user?.email ?? null} />

      {(showBirthDate || showAge || showGender || showJoined || localeLabel) && (
        <section className="bg-xiio-surface rounded-2xl p-5 border border-white/10">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            {showBirthDate && profile.birthDate && (
              <MetaField
                label={t("accountProfile.birthDate")}
                value={formatBirthDateForDisplay(profile.birthDate, dateLocale)}
              />
            )}
            {showAge && <MetaField label={t("accountProfile.age")} value={String(profile.age)} />}
            {showGender && profile.gender && (
              <MetaField
                label={t("accountProfile.gender")}
                value={t(genderLabelKey(profile.gender))}
              />
            )}
            {localeLabel && <MetaField label={t("settings.language")} value={localeLabel} />}
            {showJoined && (
              <MetaField
                label={t("accountProfile.joinedAt")}
                value={formatDateTime(profile.createdAt)}
              />
            )}
          </dl>
        </section>
      )}

      <section className="bg-xiio-surface rounded-2xl p-5 border border-white/10">
        <div className="flex flex-wrap gap-1 p-1 rounded-xl bg-white/5 border border-white/10 mb-5">
          {MAIN_TABS.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setMainTab(id)}
              className={`flex-1 min-w-[100px] py-2.5 px-3 rounded-lg text-sm font-medium transition ${
                mainTab === id
                  ? "bg-xiio-accent text-white shadow-sm"
                  : "text-xiio-muted hover:text-white"
              }`}
            >
              {mainTabLabels[id]}
            </button>
          ))}
        </div>

        {mainTab === "activity" && (
          <>
            <div className="flex gap-1 p-1 rounded-xl bg-white/5 border border-white/10 mb-5">
              {activityTabs.map(({ id, labelKey, count }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActivityTab(id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition ${
                    activityTab === id
                      ? "bg-white/15 text-white"
                      : "text-xiio-muted hover:text-white"
                  }`}
                >
                  <span>{t(labelKey)}</span>
                  {!activityLoading && count !== undefined && count > 0 && (
                    <span className="text-xs tabular-nums px-1.5 py-0.5 rounded-md bg-white/10">
                      {count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {activityErr && activityTab !== "uploads" && (
              <p className="text-sm text-red-400 mb-4">{activityErr}</p>
            )}

            {activityTab === "uploads" && <AccountUploadsList />}

            {activityTab === "likes" &&
              (activityLoading ? (
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
              ))}

            {activityTab === "watched" &&
              (activityLoading ? (
                <p className="text-sm text-xiio-muted text-center py-8">{t("common.loading")}</p>
              ) : (
                <AccountWorkActivityList
                  items={watched}
                  emptyMessage={t("accountProfile.watchedEmpty")}
                  emptyCtaLabel={t("accountProfile.emptyWatchedCta")}
                  emptyCtaHref="/movies"
                  showTarget
                />
              ))}
          </>
        )}

        {mainTab === "profile" && (
          <div className="space-y-8">
            <ProProfileEditor />
            <div className="pt-6 border-t border-white/10">
              <PortfolioShareSection />
            </div>
          </div>
        )}

        {mainTab === "discover" && <DiscoverBooth />}
      </section>
    </div>
  );
}
