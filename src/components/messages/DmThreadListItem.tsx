"use client";

import { usePathname, useRouter } from "next/navigation";
import type { DmThreadRow } from "@/components/messages/types";
import DmProfileLink from "@/components/messages/DmProfileLink";
import ProfileAvatar from "@/components/profile/ProfileAvatar";
import { formatDmTime } from "@/lib/dm/formatDmTime";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/context/LocaleContext";

type Props = {
  thread: DmThreadRow;
};

export default function DmThreadListItem({ thread }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const { t, locale } = useTranslations();
  const active = pathname === `/messages/${thread.threadId}`;

  const preview =
    thread.lastSenderUid === user?.uid && thread.lastMessagePreview
      ? `${t("dm.inbox.youPrefix")}${thread.lastMessagePreview}`
      : thread.lastMessagePreview;

  const openThread = () => router.push(`/messages/${thread.threadId}`);

  const onRowClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("a")) return;
    openThread();
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onRowClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          if ((e.target as HTMLElement).closest("a")) return;
          e.preventDefault();
          openThread();
        }
      }}
      className={`flex items-center gap-3 px-4 py-3 transition hover:bg-white/5 cursor-pointer ${
        active ? "bg-white/10" : ""
      }`}
    >
      <DmProfileLink
        handle={thread.otherHandle}
        uid={thread.otherUid}
        stopPropagation
        className="shrink-0"
      >
        <ProfileAvatar
          displayName={thread.otherDisplayName}
          avatarUrl={thread.otherAvatarUrl}
          className="w-12 h-12 rounded-full bg-white/10 ring-1 ring-white/15 flex items-center justify-center text-sm font-bold text-white overflow-hidden shrink-0"
          imgClassName="w-full h-full object-cover"
        />
      </DmProfileLink>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <DmProfileLink
            handle={thread.otherHandle}
            uid={thread.otherUid}
            stopPropagation
            className="min-w-0"
          >
            <p className="font-semibold text-sm text-white truncate">
              {thread.otherDisplayName}
            </p>
          </DmProfileLink>
          <span className="flex items-center gap-1.5 shrink-0">
            {thread.unread && (
              <span className="w-2 h-2 rounded-full bg-xiio-accent" aria-hidden />
            )}
            {thread.lastMessageAt && (
              <span className="text-[11px] text-xiio-muted tabular-nums">
                {formatDmTime(thread.lastMessageAt, locale)}
              </span>
            )}
          </span>
        </div>
        <p
          className={`text-sm truncate mt-0.5 ${thread.unread ? "text-white font-medium" : "text-xiio-muted"}`}
        >
          {preview || t("dm.threadEmpty")}
        </p>
      </div>
    </div>
  );
}
