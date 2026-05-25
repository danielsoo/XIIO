"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AppPageShell from "@/components/layout/AppPageShell";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/context/LocaleContext";
import PeopleProfileActions from "@/components/profile/PeopleProfileActions";
import ProfileWorksThumbnailGrid from "@/components/profile/ProfileWorksThumbnailGrid";
import PublicProfileHeader from "@/components/profile/PublicProfileHeader";
type WorkCard = {
  workId: string;
  ownerUid: string;
  title: string;
  role: string;
  characterName?: string;
  thumbnailUrl?: string | null;
  watchPath: string;
};

type ProfilePayload = {
  profile: {
    uid: string;
    handle: string;
    displayName: string;
    headline?: string;
    bio?: string;
    openToCollaborate?: boolean;
    collaborationNote?: string;
    followerCount?: number;
    followingCount?: number;
  };
  viewer?: { uid: string; isSelf: boolean; isFollowing: boolean } | null;
  directed: WorkCard[];
  credited: WorkCard[];
};

export default function PeopleProfilePage() {
  const { handle } = useParams<{ handle: string }>();
  const { t } = useTranslations();
  const { user } = useAuth();
  const [data, setData] = useState<ProfilePayload | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!handle) return;
    void (async () => {
      setLoading(true);
      try {
        const headers: HeadersInit = {};
        if (user) {
          const token = await user.getIdToken();
          headers.Authorization = `Bearer ${token}`;
        }
        const res = await fetch(`/api/people/${encodeURIComponent(handle)}`, { headers });
        if (!res.ok) {
          setErr(t("network.people.notFound"));
          setData(null);
          return;
        }
        setData((await res.json()) as ProfilePayload);
        setErr(null);
      } catch {
        setErr(t("network.people.loadError"));
      } finally {
        setLoading(false);
      }
    })();
  }, [handle, t, user]);

  const renderWorks = (items: WorkCard[], title: string) => {
    if (items.length === 0) return null;
    return (
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-white mb-4">{title}</h2>
        <ProfileWorksThumbnailGrid items={items} linkToWatch />
      </section>
    );
  };

  return (
    <AppPageShell>
      {loading ? (
        <p className="text-xiio-muted">{t("common.loading")}</p>
      ) : err || !data ? (
        <p className="text-red-400">{err ?? t("network.people.notFound")}</p>
      ) : (
        <>
          <PublicProfileHeader
            handle={data.profile.handle}
            displayName={data.profile.displayName}
            headline={data.profile.headline}
            bio={data.profile.bio}
            openToCollaborate={data.profile.openToCollaborate}
            collaborationNote={data.profile.collaborationNote}
            followerCount={data.profile.followerCount}
            followingCount={data.profile.followingCount}
            actions={
              <PeopleProfileActions
                profileUid={data.profile.uid}
                handle={data.profile.handle}
                isSelf={!!data.viewer?.isSelf}
                initialFollowing={!!data.viewer?.isFollowing}
              />
            }
          />
          {renderWorks(data.directed, t("network.people.directed"))}
          {renderWorks(data.credited, t("network.people.credited"))}
        </>
      )}
    </AppPageShell>
  );
}
