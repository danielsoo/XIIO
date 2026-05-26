"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import DmSidebar from "@/components/messages/DmSidebar";
import DmNewMessageModal from "@/components/messages/DmNewMessageModal";

type Props = {
  children: ReactNode;
};

export default function DmInboxLayout({ children }: Props) {
  const pathname = usePathname();
  const hasThread = /^\/messages\/[^/]+$/.test(pathname);

  return (
    <>
      <div className="flex min-h-[calc(100vh-6rem)] max-h-[calc(100vh-6rem)] border border-white/10 rounded-2xl overflow-hidden bg-xiio-surface/40">
        <aside
          className={`w-full md:w-[360px] shrink-0 flex flex-col border-r border-white/10 bg-xiio-bg ${
            hasThread ? "hidden md:flex" : "flex"
          }`}
        >
          <DmSidebar />
        </aside>
        <section
          className={`flex-1 min-w-0 flex flex-col bg-xiio-bg ${
            hasThread ? "flex" : "hidden md:flex"
          }`}
        >
          {children}
        </section>
      </div>
      <DmNewMessageModal />
    </>
  );
}
