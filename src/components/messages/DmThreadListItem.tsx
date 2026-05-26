"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { DmThreadRow } from "@/components/messages/types";
import ProfileAvatar from "@/components/profile/ProfileAvatar";
import { formatDmTime } from "@/lib/dm/formatDmTime";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/context/LocaleContext";

type Props = {
  thread: DmThreadRow;
};

export default function DmThreadListItem({ thread }: Props) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { t, locale } = useTranslations();
  const active = pathname === `/messages/${thread.threadId}`;

  const preview =
    thread.lastSenderUid === user?.uid && thread.lastMessagePreview
      ? `${t("dm.inbox.youPrefix")}${thread.lastMessagePreview}`
      : thread.lastMessagePreview;

  return (
    <Link
      href={`/messages/${thread.threadId}`}
      className={`flex items-center gap-3 px-4 py-3 transition hover:bg-white/5 ${
        active ? "bg-white/10" : ""
      }`}
    >
      <ProfileAvatar
        displayName={thread.otherDisplayName}
        avatarUrl={thread.otherAvatarUrl}
        className="w-12 h-12 rounded-full bg-white/10 ring-1 ring-white/15 flex items-center justify-center text-sm font-bold text-white overflow-hidden shrink-0"
        imgClassName="w-full h-full object-cover"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="font-semibold text-sm text-white truncate">{thread.otherDisplayName}</p>
          {thread.lastMessageAt && (
            <span className="text-[11px] text-xiio-muted shrink-0 tabular-nums">
              {formatDmTime(thread.lastMessageAt, locale)}
            </span>
          )}
        </div>
        <p className="text-sm text-xiio-muted truncate mt-0.5">
          {preview || t("dm.threadEmpty")}
        </p>
      </div>
    </Link>
  );
}
