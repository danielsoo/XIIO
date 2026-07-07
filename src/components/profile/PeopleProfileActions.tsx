"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BusinessInviteComposerModal from "@/components/messages/BusinessInviteComposerModal";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/context/LocaleContext";

type Props = {
  profileUid: string;
  handle: string;
  displayName?: string;
  isSelf: boolean;
  initialFollowing: boolean;
};

export default function PeopleProfileActions({
  profileUid,
  handle,
  displayName,
  isSelf,
  initialFollowing,
}: Props) {
  const { user } = useAuth();
  const { t } = useTranslations();
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [busy, setBusy] = useState(false);
  const [inviteComposerOpen, setInviteComposerOpen] = useState(false);

  if (isSelf) {
    return null;
  }

  if (!user) {
    return (
      <Link href="/login" className="text-sm text-xiio-accent hover:underline">
        {t("common.loginRequired")}
      </Link>
    );
  }

  const toggleFollow = async () => {
    setBusy(true);
    try {
      const token = await user.getIdToken();
      const method = following ? "DELETE" : "POST";
      const res = await fetch(`/api/me/follows/${profileUid}`, {
        method,
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setFollowing(!following);
    } finally {
      setBusy(false);
    }
  };

  const startDm = async () => {
    setBusy(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/me/dm/threads", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ targetUid: profileUid }),
      });
      const data = (await res.json()) as { threadId?: string; message?: string };
      if (res.ok && data.threadId) {
        router.push(`/messages/${data.threadId}`);
      }
    } finally {
      setBusy(false);
    }
  };

  const btnOutline =
    "px-4 py-2 rounded-lg text-sm font-medium border border-white/20 text-white hover:bg-white/5 disabled:opacity-40";

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        disabled={busy}
        onClick={() => void toggleFollow()}
        className={following ? btnOutline : "px-4 py-2 rounded-lg text-sm font-medium bg-xiio-accent text-white disabled:opacity-40"}
      >
        {following ? t("follow.following") : t("follow.follow")}
      </button>
      <button type="button" disabled={busy} onClick={() => void startDm()} className={btnOutline}>
        {t("dm.message")}
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => setInviteComposerOpen(true)}
        className={btnOutline}
      >
        {t("dm.invites.composerTitle")}
      </button>
      {inviteComposerOpen && (
        <BusinessInviteComposerModal
          presetRecipient={{ uid: profileUid, handle, displayName: displayName || handle }}
          onClose={() => setInviteComposerOpen(false)}
        />
      )}
    </div>
  );
}
