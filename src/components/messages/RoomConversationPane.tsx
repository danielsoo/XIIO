"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDmInbox } from "@/components/messages/DmInboxContext";
import DmProfileLink from "@/components/messages/DmProfileLink";
import ProfileAvatar from "@/components/profile/ProfileAvatar";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/context/LocaleContext";
import { formatClockTime, isSameClockMinute } from "@/lib/dm/formatDmTime";

type Message = {
  id: string;
  senderUid: string;
  text: string;
  createdAt: string | null;
  pending?: boolean;
  failed?: boolean;
};
type Member = { uid: string; handle: string | null; displayName: string; avatarUrl: string | null };

type Props = {
  roomId: string;
};

export default function RoomConversationPane({ roomId }: Props) {
  const { user } = useAuth();
  const { t, locale } = useTranslations();
  const router = useRouter();
  const { refreshRooms } = useDmInbox();
  const [messages, setMessages] = useState<Message[]>([]);
  const [name, setName] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lastMessageIdRef = useRef<string | null>(null);

  const load = useCallback(async () => {
    if (!user || !roomId) return;
    const token = await user.getIdToken();
    const res = await fetch(`/api/me/rooms/${roomId}/messages`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      if (res.status === 403 || res.status === 404) setNotFound(true);
      return;
    }
    const data = (await res.json()) as {
      messages?: Message[];
      name?: string;
      members?: Member[];
    };
    setMessages(data.messages ?? []);
    setName(data.name ?? "");
    setMembers(data.members ?? []);
  }, [user, roomId]);

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), 8000);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    const lastId = messages.length > 0 ? messages[messages.length - 1].id : null;
    if (lastId === lastMessageIdRef.current) return;
    const isFirstLoad = lastMessageIdRef.current === null;
    lastMessageIdRef.current = lastId;
    scrollContainerRef.current?.scrollTo({
      top: scrollContainerRef.current.scrollHeight,
      behavior: isFirstLoad ? "auto" : "smooth",
    });
  }, [messages]);

  const memberMap = useMemo(() => {
    const map = new Map<string, Member>();
    for (const m of members) map.set(m.uid, m);
    return map;
  }, [members]);

  const otherMembers = useMemo(
    () => members.filter((m) => m.uid !== user?.uid),
    [members, user]
  );

  const send = () => {
    if (!user || !roomId) return;
    const payload = text.trim();
    if (!payload) return;

    // Show the message immediately — the network call happens in the background,
    // so sending never blocks on Firestore round-trip latency.
    setText("");
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const nowIso = new Date().toISOString();
    setMessages((prev) => [
      ...prev,
      { id: tempId, senderUid: user.uid, text: payload, createdAt: nowIso, pending: true },
    ]);

    void (async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch(`/api/me/rooms/${roomId}/messages`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text: payload }),
        });
        if (res.ok) {
          const data = (await res.json()) as { messageId?: string };
          if (data.messageId) {
            const messageId = data.messageId;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === tempId ? { id: messageId, senderUid: user.uid, text: payload, createdAt: nowIso } : m
              )
            );
          }
          // Background sync — reconciles unread badges / room list ordering with
          // what's already shown optimistically; doesn't block anything above.
          void load();
          void refreshRooms();
        } else {
          setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...m, pending: false, failed: true } : m)));
        }
      } catch {
        setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...m, pending: false, failed: true } : m)));
      }
    })();
  };

  const leave = async () => {
    if (!user || busy) return;
    if (!window.confirm(t("dm.rooms.leaveConfirm"))) return;
    setBusy(true);
    try {
      const token = await user.getIdToken();
      await fetch(`/api/me/rooms/${roomId}/leave`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      await refreshRooms();
      router.push("/messages");
    } finally {
      setBusy(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    send();
  };

  if (!user) return null;

  if (notFound) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-xiio-muted">{t("dm.rooms.errorGeneric")}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-white/10 shrink-0">
        <Link
          href="/messages"
          className="md:hidden text-sm text-xiio-muted hover:text-white shrink-0"
          aria-label={t("dm.back")}
        >
          ←
        </Link>
        <div className="relative w-10 h-10 shrink-0">
          {otherMembers.slice(0, 3).map((m, i) => (
            <div
              key={m.uid}
              className="absolute"
              style={
                i === 0
                  ? { left: 0, top: 0, zIndex: 3 }
                  : i === 1
                    ? { left: 10, top: 10, zIndex: 2 }
                    : { left: 20, top: 0, zIndex: 1 }
              }
            >
              <ProfileAvatar
                displayName={m.displayName}
                avatarUrl={m.avatarUrl}
                className="w-7 h-7 rounded-full bg-white/10 ring-2 ring-xiio-bg flex items-center justify-center text-[9px] font-bold text-white overflow-hidden"
                imgClassName="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-white truncate">{name}</p>
          <p className="text-xs text-xiio-muted truncate">
            {t("dm.rooms.membersCount", { count: members.length })}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void leave()}
          disabled={busy}
          className="text-xs text-red-400 hover:underline shrink-0 disabled:opacity-40"
        >
          {t("dm.rooms.leaveRoom")}
        </button>
      </header>

      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-4 py-4 min-h-0">
        {messages.length === 0 ? (
          <p className="text-center text-sm text-xiio-muted py-12">{t("dm.threadEmpty")}</p>
        ) : (
          messages.map((m, i) => {
            const mine = m.senderUid === user.uid;
            const sender = memberMap.get(m.senderUid);
            const prev = i > 0 ? messages[i - 1] : null;
            const next = i < messages.length - 1 ? messages[i + 1] : null;
            const groupedWithPrev =
              prev !== null && prev.senderUid === m.senderUid && isSameClockMinute(prev.createdAt, m.createdAt);
            const isLastInGroup =
              next === null || next.senderUid !== m.senderUid || !isSameClockMinute(next.createdAt, m.createdAt);
            const marginTop = i === 0 ? "" : groupedWithPrev ? "mt-1" : "mt-3";

            if (mine) {
              return (
                <div key={m.id} className={`flex flex-col min-w-0 max-w-[75%] ml-auto items-end ${marginTop}`}>
                  <div
                    className={`px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap break-words bg-xiio-accent text-white rounded-br-md ${
                      m.pending ? "opacity-60" : ""
                    }`}
                  >
                    {m.text}
                  </div>
                  {m.failed && (
                    <p className="text-[11px] text-red-400 mt-0.5 px-1">{t("dm.sendFailed")}</p>
                  )}
                </div>
              );
            }

            return (
              <div key={m.id} className={`flex flex-col min-w-0 max-w-[75%] items-start ${marginTop}`}>
                <p className="text-[11px] text-xiio-muted mb-0.5 px-1">{sender?.displayName ?? "—"}</p>
                {/* Avatar and bubble share one row so they're always the same height —
                    the timestamp lives outside this row so it can't skew that alignment. */}
                <div className="flex gap-2 min-w-0 w-full items-end">
                  {isLastInGroup ? (
                    <DmProfileLink handle={sender?.handle ?? null} uid={m.senderUid} className="shrink-0">
                      <ProfileAvatar
                        displayName={sender?.displayName || "?"}
                        avatarUrl={sender?.avatarUrl ?? null}
                        className="w-8 h-8 rounded-full bg-white/10 ring-1 ring-white/20 flex items-center justify-center text-xs font-bold text-white overflow-hidden shrink-0"
                        imgClassName="w-full h-full object-cover"
                      />
                    </DmProfileLink>
                  ) : (
                    <div className="w-8 h-8 shrink-0" aria-hidden />
                  )}
                  <div className="min-w-0 px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap break-words bg-[#2c2c2e] text-white rounded-bl-md">
                    {m.text}
                  </div>
                </div>
                {isLastInGroup && (
                  <p className="text-[11px] text-xiio-muted mt-0.5 pl-10">
                    {formatClockTime(m.createdAt, locale)}
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex gap-2 border-t border-white/10 px-4 py-3 shrink-0"
      >
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t("dm.placeholder")}
          className="flex-1 bg-white/10 border border-white/15 rounded-full px-4 py-2.5 text-sm text-white disabled:opacity-50 focus:outline-none focus:border-xiio-accent/50"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="px-4 py-2.5 rounded-full bg-xiio-accent text-white text-sm font-semibold disabled:opacity-40 hover:bg-xiio-accent-hover transition"
        >
          {t("dm.send")}
        </button>
      </form>
    </div>
  );
}
