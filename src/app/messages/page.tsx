"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/context/LocaleContext";
import AppPageShell from "@/components/layout/AppPageShell";
import SubpageHeader from "@/components/layout/SubpageHeader";

type ThreadRow = {
  threadId: string;
  otherUid: string;
  otherHandle: string | null;
  otherDisplayName: string;
  lastMessagePreview: string;
};

export default function MessagesPage() {
  const { user } = useAuth();
  const { t } = useTranslations();
  const [threads, setThreads] = useState<ThreadRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    const token = await user.getIdToken();
    const res = await fetch("/api/me/dm/threads", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      setThreads([]);
      setLoading(false);
      return;
    }
    const data = (await res.json()) as { threads?: ThreadRow[] };
    setThreads(data.threads ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

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
      <SubpageHeader
        title={t("dm.inboxTitle")}
        description={t("dm.inboxLead")}
        backFallbackHref="/account"
      />
      {loading ? (
        <p className="text-xiio-muted text-sm">{t("common.loading")}</p>
      ) : threads.length === 0 ? (
        <p className="text-xiio-muted text-sm">{t("dm.empty")}</p>
      ) : (
        <ul className="space-y-2 max-w-2xl">
          {threads.map((th) => (
            <li key={th.threadId}>
              <Link
                href={`/messages/${th.threadId}`}
                className="block p-4 rounded-xl border border-white/10 bg-xiio-surface hover:border-xiio-accent/30 transition"
              >
                <p className="font-medium text-white">{th.otherDisplayName}</p>
                {th.otherHandle && (
                  <p className="text-xs text-xiio-accent">@{th.otherHandle}</p>
                )}
                {th.lastMessagePreview && (
                  <p className="text-sm text-xiio-muted mt-1 truncate">{th.lastMessagePreview}</p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AppPageShell>
  );
}
