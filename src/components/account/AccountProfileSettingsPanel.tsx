"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/context/LocaleContext";
import ProfileEditPanel from "@/components/profile/ProfileEditPanel";
import ProfileOwnerWorkspace from "@/components/profile/ProfileOwnerWorkspace";
import type { PeopleProfilePayload } from "@/components/profile/PeopleProfileView";
import type { ProfessionalProfileSaved } from "@/hooks/useProfessionalProfileSave";
import type { DirectorNameChangeRequest, UserProfileDoc } from "@/types/user";

type Props = {
  accountProfile: UserProfileDoc;
  onHandleClaimed?: () => void;
};

function AccountProfileSettingsInner({ accountProfile, onHandleClaimed }: Props) {
  const { user } = useAuth();
  const { t } = useTranslations();
  const [data, setData] = useState<PeopleProfilePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const handle = accountProfile.handle?.trim() ?? "";

  const load = useCallback(async () => {
    if (!user || !handle) {
      setLoading(false);
      setData(null);
      return;
    }
    setLoading(true);
    setErr(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/people/${encodeURIComponent(handle)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setErr(t("network.people.loadError"));
        setData(null);
        return;
      }
      setData((await res.json()) as PeopleProfilePayload);
    } catch {
      setErr(t("network.people.loadError"));
    } finally {
      setLoading(false);
    }
  }, [user, handle, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const onProfileSaved = useCallback(
    (saved: ProfessionalProfileSaved) => {
      const newHandle = saved.handle?.trim();
      if (newHandle && newHandle !== handle) {
        onHandleClaimed?.();
        return;
      }
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          profile: {
            ...prev.profile,
            headline: saved.headline ?? undefined,
            bio: saved.bio ?? undefined,
            openToCollaborate: saved.openToCollaborate,
            collaborationNote: saved.collaborationNote ?? undefined,
          },
        };
      });
    },
    [handle, onHandleClaimed]
  );

  const onIdentityRequest = useCallback(
    (field: "displayNameChangeRequest" | "handleChangeRequest", req: DirectorNameChangeRequest) => {
      setData((prev) => {
        if (!prev?.identity) return prev;
        return { ...prev, identity: { ...prev.identity, [field]: req } };
      });
    },
    []
  );

  if (!handle) {
    const stubProfile = {
      uid: user?.uid ?? "",
      handle: "",
      displayName: accountProfile.displayName,
      headline: undefined,
      bio: undefined,
    };
    return (
      <div className="space-y-4">
        <p className="text-sm text-xiio-muted">{t("accountProfile.profileNoHandle")}</p>
        <ProfileEditPanel
          profile={stubProfile}
          handleLocked={false}
          onSaved={(saved) => {
            if (saved.handle?.trim()) onHandleClaimed?.();
          }}
        />
      </div>
    );
  }

  if (loading) {
    return <p className="text-sm text-xiio-muted py-6 text-center">{t("common.loading")}</p>;
  }

  if (err || !data) {
    return <p className="text-sm text-red-400 py-6">{err ?? t("network.people.loadError")}</p>;
  }

  const handleLocked = !!data.profile.handle?.trim();

  return (
    <ProfileOwnerWorkspace
      data={data}
      handleLocked={handleLocked}
      onProfileSaved={onProfileSaved}
      onIdentityRequest={onIdentityRequest}
      urlMode="account"
      showPublicProfileLink
    />
  );
}

export default function AccountProfileSettingsPanel(props: Props) {
  const { t } = useTranslations();
  return (
    <Suspense fallback={<p className="text-sm text-xiio-muted py-6">{t("common.loading")}</p>}>
      <AccountProfileSettingsInner {...props} />
    </Suspense>
  );
}
