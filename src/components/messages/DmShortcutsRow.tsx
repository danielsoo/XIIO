"use client";

import { useDmInbox } from "@/components/messages/DmInboxContext";
import DmProfileLink from "@/components/messages/DmProfileLink";
import ProfileAvatar from "@/components/profile/ProfileAvatar";
import { useTranslations } from "@/context/LocaleContext";

export default function DmShortcutsRow() {
  const { shortcutThreads } = useDmInbox();
  const { t } = useTranslations();

  if (shortcutThreads.length === 0) return null;

  return (
    <div className="px-4 py-3 border-b border-white/10">
      <p className="text-xs font-medium text-xiio-muted mb-2">{t("dm.shortcuts.label")}</p>
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin">
        {shortcutThreads.map((th) => (
          <div
            key={th.threadId}
            className="flex flex-col items-center gap-1 shrink-0 w-16"
          >
            <DmProfileLink handle={th.otherHandle} className="group">
              <div className="p-[2px] rounded-full ring-2 ring-xiio-accent/70 group-hover:ring-xiio-accent transition">
                <ProfileAvatar
                  displayName={th.otherDisplayName}
                  avatarUrl={th.otherAvatarUrl}
                  className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold text-white overflow-hidden"
                  imgClassName="w-full h-full object-cover rounded-full"
                />
              </div>
            </DmProfileLink>
            <DmProfileLink handle={th.otherHandle} className="w-full">
              <span className="text-[10px] text-xiio-muted truncate w-full text-center block hover:text-white transition">
                {th.otherDisplayName.split(" ")[0]}
              </span>
            </DmProfileLink>
          </div>
        ))}
      </div>
    </div>
  );
}
