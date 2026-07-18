"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import BusinessInviteComposerModal from "@/components/messages/BusinessInviteComposerModal";
import DmSidebar from "@/components/messages/DmSidebar";
import { useDmInbox } from "@/components/messages/DmInboxContext";
import DmNewMessageModal from "@/components/messages/DmNewMessageModal";
import RoomComposerModal from "@/components/messages/RoomComposerModal";

type Props = {
  children: ReactNode;
};

export default function DmInboxLayout({ children }: Props) {
  const pathname = usePathname();
  const hasThread =
    /^\/messages\/[^/]+$/.test(pathname) || /^\/messages\/rooms\/[^/]+$/.test(pathname);
  const { businessInviteComposerOpen, closeBusinessInviteComposer, roomComposerOpen, closeRoomComposer } =
    useDmInbox();

  return (
    <>
      <div className="mx-auto flex h-[calc(100%_-_2rem)] min-h-0 w-full max-w-[1160px] border border-white/15 rounded-2xl overflow-hidden bg-xiio-surface">
        <aside
          className={`w-full md:w-[360px] shrink-0 flex flex-col border-r border-white/10 bg-xiio-surface ${
            hasThread ? "hidden md:flex" : "flex"
          }`}
        >
          <DmSidebar />
        </aside>
        <section
          className={`flex-1 min-w-0 flex flex-col bg-xiio-surface ${
            hasThread ? "flex" : "hidden md:flex"
          }`}
        >
          {children}
        </section>
      </div>
      <DmNewMessageModal />
      {businessInviteComposerOpen && (
        <BusinessInviteComposerModal onClose={closeBusinessInviteComposer} />
      )}
      {roomComposerOpen && <RoomComposerModal onClose={closeRoomComposer} />}
    </>
  );
}
