"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/context/LocaleContext";
import PeopleProfileOwnerTabs from "@/components/profile/PeopleProfileOwnerTabs";
import PublicProfileCard from "@/components/profile/PublicProfileCard";
import ProfileWorksThumbnailGrid from "@/components/profile/ProfileWorksThumbnailGrid";
import type { ProfessionalProfileSaved } from "@/hooks/useProfessionalProfileSave";
import type { DirectorNameChangeRequest } from "@/types/user";

type WorkCard = {
  workId: string;
  ownerUid: string;
  title: string;
  role: string;
  characterName?: string;
  thumbnailUrl?: string | null;
  watchPath: string;
};

export type PeopleProfilePayload = {
  profile: {
    uid: string;
    handle: string;
    displayName: string;
    avatarUrl?: string | null;
    headline?: string;
    bio?: string;
    openToCollaborate?: boolean;
    collaborationNote?: string;
    followerCount?: number;
    followingCount?: number;
  };
  viewer?: { uid: string; isSelf: boolean; isFollowing: boolean } | null;
  identity?: {
    isDiscoverable: boolean;
    displayNameChangeRequest: DirectorNameChangeRequest | null;
    handleChangeRequest: DirectorNameChangeRequest | null;
  };
  directed: WorkCard[];
  credited: WorkCard[];
};

type Props = {
  handle: string;
};

export default function PeopleProfileView({ handle }: Props) {
  const { t } = useTranslations();
  const { user } = useAuth();
  const [data, setData] = useState<PeopleProfilePayload | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!handle) return;
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
      setData((await res.json()) as PeopleProfilePayload);
      setErr(null);
    } catch {
      setErr(t("network.people.loadError"));
    } finally {
      setLoading(false);
    }
  }, [handle, t, user]);

  useEffect(() => {
    void load();
  }, [load]);

  const onProfileSaved = useCallback((saved: ProfessionalProfileSaved) => {
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        profile: {
          ...prev.profile,
          handle: saved.handle?.trim() || prev.profile.handle,
          headline: saved.headline ?? undefined,
          bio: saved.bio ?? undefined,
          openToCollaborate: saved.openToCollaborate,
          collaborationNote: saved.collaborationNote ?? undefined,
        },
      };
    });
  }, []);

  const onAvatarUpdated = useCallback((avatarUrl: string | null) => {
    setData((prev) => {
      if (!prev) return prev;
      return { ...prev, profile: { ...prev.profile, avatarUrl } };
    });
  }, []);

  const onIdentityRequest = useCallback(
    (field: "displayNameChangeRequest" | "handleChangeRequest", req: DirectorNameChangeRequest) => {
      setData((prev) => {
        if (!prev?.identity) return prev;
        return {
          ...prev,
          identity: { ...prev.identity, [field]: req },
        };
      });
    },
    []
  );

  const renderWorks = (items: WorkCard[], title: string) => {
    if (items.length === 0) return null;
    return (
      <section className="mb-10 w-full">
        <h2 className="text-lg font-semibold text-white mb-4">{title}</h2>
        <ProfileWorksThumbnailGrid items={items} linkToWatch />
      </section>
    );
  };

  if (loading) {
    return <p className="text-xiio-muted">{t("common.loading")}</p>;
  }

  if (err || !data) {
    return <p className="text-red-400">{err ?? t("network.people.notFound")}</p>;
  }

  const isSelf = !!data.viewer?.isSelf;
  const handleLocked = !!data.profile.handle?.trim();

  if (isSelf) {
    return (
      <Suspense fallback={<p className="text-xiio-muted">{t("common.loading")}</p>}>
        <PeopleProfileOwnerTabs
          data={data}
          handleLocked={handleLocked}
          onProfileSaved={onProfileSaved}
          onIdentityRequest={onIdentityRequest}
          onAvatarUpdated={onAvatarUpdated}
        />
      </Suspense>
    );
  }

  return (
    <div className="max-w-5xl mx-auto w-full space-y-8">
      <PublicProfileCard
        profile={data.profile}
        isSelf={false}
        isFollowing={!!data.viewer?.isFollowing}
      />
      {renderWorks(data.directed, t("network.people.directed"))}
      {renderWorks(data.credited, t("network.people.credited"))}
    </div>
  );
}
