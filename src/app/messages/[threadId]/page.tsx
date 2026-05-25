"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/context/LocaleContext";
import AppPageShell from "@/components/layout/AppPageShell";

type Message = { id: string; senderUid: string; text: string };

export default function MessageThreadPage() {
  const { threadId } = useParams<{ threadId: string }>();
  const { user } = useAuth();
  const { t } = useTranslations();
  const [messages, setMessages] = useState<Message[]>([]);
  const [otherName, setOtherName] = useState("");
  const [otherHandle, setOtherHandle] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    if (!user || !threadId) return;
    const token = await user.getIdToken();
    const res = await fetch(`/api/me/dm/threads/${threadId}/messages`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const data = (await res.json()) as {
      messages?: Message[];
      otherDisplayName?: string;
      otherHandle?: string | null;
    };
    setMessages(data.messages ?? []);
    setOtherName(data.otherDisplayName ?? "");
    setOtherHandle(data.otherHandle ?? null);
  }, [user, threadId]);

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), 8000);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!user || !threadId || !text.trim()) return;
    setBusy(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/me/dm/threads/${threadId}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });
      if (res.ok) {
        setText("");
        await load();
      }
    } finally {
      setBusy(false);
    }
  };

  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-xiio-bg">
        <Link href="/login" className="text-xiio-accent hover:underline">
          {t("common.loginRequired")}
        </Link>
      </main>
    );
  }

  return (
    <AppPageShell>
      <div className="max-w-2xl mx-auto flex flex-col min-h-[70vh]">
        <div className="mb-4 flex items-center gap-3">
          <Link href="/messages" className="text-sm text-xiio-muted hover:text-white">
            ← {t("dm.back")}
          </Link>
          <div>
            <p className="font-semibold text-white">{otherName}</p>
            {otherHandle && (
              <Link href={`/people/${otherHandle}`} className="text-xs text-xiio-accent hover:underline">
                @{otherHandle}
              </Link>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1">
          {messages.map((m) => {
            const mine = m.senderUid === user.uid;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap ${
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
          <div ref={bottomRef} />
        </div>

        <div className="flex gap-2 border-t border-white/10 pt-4">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && void send()}
            placeholder={t("dm.placeholder")}
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
          />
          <button
            type="button"
            disabled={busy || !text.trim()}
            onClick={() => void send()}
            className="px-4 py-2 rounded-lg bg-xiio-accent text-white text-sm disabled:opacity-40"
          >
            {t("dm.send")}
          </button>
        </div>
      </div>
    </AppPageShell>
  );
}
