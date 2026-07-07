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
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import type {
  DmMainTab,
  DmThreadRow,
  RoomListItem,
} from "@/components/messages/types";

const VALID_MAIN_TABS: DmMainTab[] = ["messages", "groups", "requests", "invites"];

function isDmMainTab(v: string | null): v is DmMainTab {
  return v != null && (VALID_MAIN_TABS as string[]).includes(v);
}

type DmInboxContextValue = {
  threads: DmThreadRow[];
  loading: boolean;
  mainTab: DmMainTab;
  setMainTab: (tab: DmMainTab) => void;
  search: string;
  setSearch: (q: string) => void;
  filteredThreads: DmThreadRow[];
  shortcutThreads: DmThreadRow[];
  refresh: () => Promise<void>;
  newMessageOpen: boolean;
  openNewMessage: () => void;
  closeNewMessage: () => void;
  businessInviteComposerOpen: boolean;
  openBusinessInviteComposer: () => void;
  closeBusinessInviteComposer: () => void;
  rooms: RoomListItem[];
  roomsLoading: boolean;
  refreshRooms: () => Promise<void>;
  roomComposerOpen: boolean;
  openRoomComposer: () => void;
  closeRoomComposer: () => void;
};

const DmInboxContext = createContext<DmInboxContextValue | null>(null);

export function DmInboxProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [threads, setThreads] = useState<DmThreadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [mainTab, setMainTab] = useState<DmMainTab>(() => {
    const tab = searchParams.get("tab");
    return isDmMainTab(tab) ? tab : "messages";
  });
  const [search, setSearch] = useState("");
  const [newMessageOpen, setNewMessageOpen] = useState(false);
  const [businessInviteComposerOpen, setBusinessInviteComposerOpen] = useState(false);

  const [rooms, setRooms] = useState<RoomListItem[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [roomComposerOpen, setRoomComposerOpen] = useState(false);

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

  const refreshRooms = useCallback(async () => {
    if (!user) {
      setRooms([]);
      setRoomsLoading(false);
      return;
    }
    const token = await user.getIdToken();
    const res = await fetch("/api/me/rooms", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      setRooms([]);
      setRoomsLoading(false);
      return;
    }
    const data = (await res.json()) as { rooms?: RoomListItem[] };
    setRooms(data.rooms ?? []);
    setRoomsLoading(false);
  }, [user]);

  useEffect(() => {
    setLoading(true);
    void refresh();
    const id = setInterval(() => void refresh(), 8000);
    return () => clearInterval(id);
  }, [refresh]);

  useEffect(() => {
    setRoomsLoading(true);
    void refreshRooms();
    const id = setInterval(() => void refreshRooms(), 8000);
    return () => clearInterval(id);
  }, [refreshRooms]);

  const tabFiltered = useMemo(() => {
    if (!user) return [];
    if (mainTab === "invites" || mainTab === "groups") return [];
    if (mainTab === "requests") {
      return threads.filter(
        (th) => th.lastSenderUid && th.lastSenderUid !== user.uid
      );
    }
    return threads;
  }, [threads, mainTab, user]);

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
      mainTab,
      setMainTab,
      search,
      setSearch,
      filteredThreads,
      shortcutThreads,
      refresh,
      newMessageOpen,
      openNewMessage: () => setNewMessageOpen(true),
      closeNewMessage: () => setNewMessageOpen(false),
      businessInviteComposerOpen,
      openBusinessInviteComposer: () => setBusinessInviteComposerOpen(true),
      closeBusinessInviteComposer: () => setBusinessInviteComposerOpen(false),
      rooms,
      roomsLoading,
      refreshRooms,
      roomComposerOpen,
      openRoomComposer: () => setRoomComposerOpen(true),
      closeRoomComposer: () => setRoomComposerOpen(false),
    }),
    [
      threads,
      loading,
      mainTab,
      search,
      filteredThreads,
      shortcutThreads,
      refresh,
      newMessageOpen,
      businessInviteComposerOpen,
      rooms,
      roomsLoading,
      refreshRooms,
      roomComposerOpen,
    ]
  );

  return <DmInboxContext.Provider value={value}>{children}</DmInboxContext.Provider>;
}

export function useDmInbox() {
  const ctx = useContext(DmInboxContext);
  if (!ctx) throw new Error("useDmInbox must be used within DmInboxProvider");
  return ctx;
}
