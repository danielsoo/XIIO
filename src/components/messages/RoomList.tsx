"use client";

import { useDmInbox } from "@/components/messages/DmInboxContext";
import RoomListItem from "@/components/messages/RoomListItem";
import { useTranslations } from "@/context/LocaleContext";

export default function RoomList() {
  const { rooms, roomsLoading } = useDmInbox();
  const { t } = useTranslations();

  if (roomsLoading) {
    return (
      <p className="px-4 py-8 text-sm text-xiio-muted text-center">{t("common.loading")}</p>
    );
  }

  if (rooms.length === 0) {
    return <p className="px-4 py-8 text-sm text-xiio-muted text-center">{t("dm.rooms.empty")}</p>;
  }

  return (
    <div className="flex-1 overflow-y-auto min-h-0">
      <ul className="divide-y divide-white/5">
        {rooms.map((room) => (
          <li key={room.roomId}>
            <RoomListItem room={room} />
          </li>
        ))}
      </ul>
    </div>
  );
}
