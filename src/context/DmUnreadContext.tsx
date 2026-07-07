"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";

const POLL_MS = 20000;

const DmUnreadContext = createContext<number>(0);

export function DmUnreadProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setCount(0);
      return;
    }

    let cancelled = false;
    const load = async () => {
      try {
        const token = await user.getIdToken();
        const [dmRes, roomRes] = await Promise.all([
          fetch("/api/me/dm/unread-count", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("/api/me/rooms/unread-count", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        const dmCount = dmRes.ok ? ((await dmRes.json()) as { count?: number }).count ?? 0 : 0;
        const roomCount = roomRes.ok ? ((await roomRes.json()) as { count?: number }).count ?? 0 : 0;
        if (!cancelled) setCount(dmCount + roomCount);
      } catch {
        /* ignore — badge just stays at its last known value */
      }
    };

    void load();
    const id = setInterval(() => void load(), POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [user]);

  return <DmUnreadContext.Provider value={count}>{children}</DmUnreadContext.Provider>;
}

export function useDmUnreadCount(): number {
  return useContext(DmUnreadContext);
}
