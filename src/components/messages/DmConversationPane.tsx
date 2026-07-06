"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDmInbox } from "@/components/messages/DmInboxContext";
import DmProfileLink from "@/components/messages/DmProfileLink";
import ProfileAvatar from "@/components/profile/ProfileAvatar";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/context/LocaleContext";

type Message = { id: string; senderUid: string; text: string };

type Props = {
  threadId: string;
};

export default function DmConversationPane({ threadId }: Props) {
  const { user } = useAuth();
  const { t } = useTranslations();
  const { refresh: refreshThreads } = useDmInbox();
  const [messages, setMessages] = useState<Message[]>([]);
  const [otherName, setOtherName] = useState("");
  const [otherUid, setOtherUid] = useState("");
  const [otherHandle, setOtherHandle] = useState<string | null>(null);
  const [otherAvatarUrl, setOtherAvatarUrl] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sendingRef = useRef(false);
  const lastMessageIdRef = useRef<string | null>(null);

  const load = useCallback(async () => {
    if (!user || !threadId) return;
    const token = await user.getIdToken();
    const res = await fetch(`/api/me/dm/threads/${threadId}/messages`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const data = (await res.json()) as {
      messages?: Message[];
      otherUid?: string;
      otherDisplayName?: string;
      otherHandle?: string | null;
      otherAvatarUrl?: string | null;
    };
    setMessages(data.messages ?? []);
    setOtherUid(data.otherUid ?? "");
    setOtherName(data.otherDisplayName ?? "");
    setOtherHandle(data.otherHandle ?? null);
    setOtherAvatarUrl(data.otherAvatarUrl ?? null);
  }, [user, threadId]);

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
    // scrollTo on the container itself — scrollIntoView would also nudge the outer
    // page scroll since it walks up every scrollable ancestor, not just this one.
    scrollContainerRef.current?.scrollTo({
      top: scrollContainerRef.current.scrollHeight,
      behavior: isFirstLoad ? "auto" : "smooth",
    });
  }, [messages]);

  const send = async () => {
    if (!user || !threadId || !text.trim()) return;
    if (sendingRef.current || busy) return;
    sendingRef.current = true;
    setBusy(true);
    const payload = text.trim();
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/me/dm/threads/${threadId}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: payload }),
      });
      if (res.ok) {
        setText("");
        await load();
        await refreshThreads();
      }
    } finally {
      sendingRef.current = false;
      setBusy(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void send();
  };

  if (!user) return null;

  const hasIncoming = messages.some((m) => m.senderUid !== user.uid);
  const hasOutgoing = messages.some((m) => m.senderUid === user.uid);

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
        <DmProfileLink handle={otherHandle} uid={otherUid} className="shrink-0">
          <ProfileAvatar
            displayName={otherName || "?"}
            avatarUrl={otherAvatarUrl}
            className="w-10 h-10 rounded-full bg-white/10 ring-1 ring-white/20 flex items-center justify-center text-sm font-bold text-white overflow-hidden shrink-0"
            imgClassName="w-full h-full object-cover"
          />
        </DmProfileLink>
        <DmProfileLink handle={otherHandle} uid={otherUid} className="min-w-0 block">
          <p className="font-semibold text-white truncate">{otherName}</p>
          {otherHandle && (
            <p className="text-xs text-xiio-accent truncate">@{otherHandle}</p>
          )}
        </DmProfileLink>
      </header>

      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
        {messages.length === 0 ? (
          <p className="text-center text-sm text-xiio-muted py-12">{t("dm.threadEmpty")}</p>
        ) : (
          <>
            {messages.map((m) => {
              const mine = m.senderUid === user.uid;
              return (
                <div
                  key={m.id}
                  className={`flex gap-2 ${mine ? "justify-end" : "justify-start items-end"}`}
                >
                  {!mine && (
                    <DmProfileLink handle={otherHandle} uid={otherUid} className="shrink-0">
                      <ProfileAvatar
                        displayName={otherName || "?"}
                        avatarUrl={otherAvatarUrl}
                        className="w-8 h-8 rounded-full bg-white/10 ring-1 ring-white/20 flex items-center justify-center text-xs font-bold text-white overflow-hidden shrink-0"
                        imgClassName="w-full h-full object-cover"
                      />
                    </DmProfileLink>
                  )}
                  <div
                    className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap ${
                      mine
                        ? "bg-xiio-accent text-white rounded-br-md"
                        : "bg-white/10 text-white rounded-bl-md"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              );
            })}
            {hasOutgoing && !hasIncoming && (
              <p className="text-xs text-xiio-muted text-left pl-10">{t("dm.waitingReply")}</p>
            )}
          </>
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
          disabled={busy}
          className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2.5 text-sm text-white disabled:opacity-50 focus:outline-none focus:border-xiio-accent/50"
        />
        <button
          type="submit"
          disabled={busy || !text.trim()}
          className="px-4 py-2.5 rounded-full bg-xiio-accent text-white text-sm font-semibold disabled:opacity-40 hover:bg-xiio-accent-hover transition"
        >
          {t("dm.send")}
        </button>
      </form>
    </div>
  );
}
