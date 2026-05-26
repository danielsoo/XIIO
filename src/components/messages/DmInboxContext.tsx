"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/context/AuthContext";
import type { DmInboxTab, DmThreadRow } from "@/components/messages/types";

type DmInboxContextValue = {
  threads: DmThreadRow[];
  loading: boolean;
  tab: DmInboxTab;
  setTab: (tab: DmInboxTab) => void;
  search: string;
  setSearch: (q: string) => void;
  filteredThreads: DmThreadRow[];
  shortcutThreads: DmThreadRow[];
  refresh: () => Promise<void>;
  newMessageOpen: boolean;
  openNewMessage: () => void;
  closeNewMessage: () => void;
};

const DmInboxContext = createContext<DmInboxContextValue | null>(null);

export function DmInboxProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [threads, setThreads] = useState<DmThreadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<DmInboxTab>("primary");
  const [search, setSearch] = useState("");
  const [newMessageOpen, setNewMessageOpen] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setThreads([]);
      setLoading(false);
      return;
    }
    const token = await user.getIdToken();
    const res = await fetch("/api/me/dm/threads", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      setThreads([]);
      setLoading(false);
      return;
    }
    const data = (await res.json()) as { threads?: DmThreadRow[] };
    setThreads(data.threads ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    setLoading(true);
    void refresh();
    const id = setInterval(() => void refresh(), 8000);
    return () => clearInterval(id);
  }, [refresh]);

  const tabFiltered = useMemo(() => {
    if (!user) return [];
    if (tab === "general") return [];
    if (tab === "requests") {
      return threads.filter(
        (th) => th.lastSenderUid && th.lastSenderUid !== user.uid
      );
    }
    return threads;
  }, [threads, tab, user]);

  const filteredThreads = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tabFiltered;
    return tabFiltered.filter((th) => {
      const name = th.otherDisplayName.toLowerCase();
      const handle = (th.otherHandle ?? "").toLowerCase();
      const preview = th.lastMessagePreview.toLowerCase();
      return name.includes(q) || handle.includes(q) || preview.includes(q);
    });
  }, [tabFiltered, search]);

  const shortcutThreads = useMemo(() => threads.slice(0, 8), [threads]);

  const value = useMemo(
    () => ({
      threads,
      loading,
      tab,
      setTab,
      search,
      setSearch,
      filteredThreads,
      shortcutThreads,
      refresh,
      newMessageOpen,
      openNewMessage: () => setNewMessageOpen(true),
      closeNewMessage: () => setNewMessageOpen(false),
    }),
    [
      threads,
      loading,
      tab,
      search,
      filteredThreads,
      shortcutThreads,
      refresh,
      newMessageOpen,
    ]
  );

  return <DmInboxContext.Provider value={value}>{children}</DmInboxContext.Provider>;
}

export function useDmInbox() {
  const ctx = useContext(DmInboxContext);
  if (!ctx) throw new Error("useDmInbox must be used within DmInboxProvider");
  return ctx;
}
