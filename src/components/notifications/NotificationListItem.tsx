"use client";

import { useRouter } from "next/navigation";
import ProfileAvatar from "@/components/profile/ProfileAvatar";
import { formatDmTime } from "@/lib/dm/formatDmTime";
import { useTranslations } from "@/context/LocaleContext";
import type { NotificationListItem as NotificationListItemType } from "@/types/notification";

type Props = {
  notification: NotificationListItemType;
  onNavigate?: () => void;
};

export default function NotificationListItem({ notification, onNavigate }: Props) {
  const router = useRouter();
  const { t, locale } = useTranslations();

  const params: Record<string, string> = {
    workTitle: notification.workTitle ?? "",
    actorName: notification.actorDisplayName ?? "",
    preview: notification.messagePreview ?? "",
    roomName: notification.roomName ?? "",
  };

  const text = t(`notifications.items.${notification.type}`, params);
  const hasActor = Boolean(notification.actorUid);

  const onClick = () => {
    onNavigate?.();
    router.push(notification.targetPath);
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-white/5 transition ${
        !notification.read ? "bg-white/[0.03]" : ""
      }`}
    >
      {hasActor ? (
        <ProfileAvatar
          displayName={notification.actorDisplayName || "?"}
          avatarUrl={notification.actorAvatarUrl}
          className="w-9 h-9 rounded-full bg-xiio-accent/20 flex items-center justify-center text-xs font-bold text-white overflow-hidden shrink-0"
          imgClassName="w-full h-full object-cover"
        />
      ) : (
        <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-sm shrink-0" aria-hidden>
          {notification.type === "work_approve" ? "✅" : "⚠️"}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm text-white/90 line-clamp-2">{text}</p>
        {notification.createdAt && (
          <p className="text-[11px] text-xiio-muted mt-0.5">
            {formatDmTime(notification.createdAt, locale)}
          </p>
        )}
      </div>
      {!notification.read && (
        <span className="w-2 h-2 rounded-full bg-xiio-accent shrink-0 mt-1.5" aria-hidden />
      )}
    </button>
  );
}
