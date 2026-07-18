"use client";

import { useEffect, useState } from "react";
import AppPageShell from "@/components/layout/AppPageShell";
import NotificationListItem from "@/components/notifications/NotificationListItem";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/context/LocaleContext";
import { useNotifications } from "@/context/NotificationContext";
import type { NotificationListItem as NotificationListItemType } from "@/types/notification";

export default function NotificationsPage() {
  const { user } = useAuth();
  const { t } = useTranslations();
  const { refresh } = useNotifications();
  const [notifications, setNotifications] = useState<NotificationListItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  const markAllRead = async () => {
    if (!user || marking) return;
    setMarking(true);
    try {
      const token = await user.getIdToken();
      await fetch("/api/me/notifications/mark-all-read", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      await refresh();
    } finally {
      setMarking(false);
    }
  };

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      const token = await user.getIdToken();
      const res = await fetch("/api/me/notifications?limit=50", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        if (!cancelled) setLoading(false);
        return;
      }
      const data = (await res.json()) as { notifications?: NotificationListItemType[] };
      if (!cancelled) {
        setNotifications(data.notifications ?? []);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  return (
    <AppPageShell className="pb-10">
      <div className="mx-auto w-full max-w-2xl">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-white">{t("notifications.title")}</h1>
          {notifications.length > 0 ? (
            <button
              type="button"
              onClick={() => void markAllRead()}
              disabled={marking}
              className="text-[13px] text-xiio-accent hover:underline disabled:opacity-40"
            >
              {t("notifications.markAllRead")}
            </button>
          ) : null}
        </div>
        <div className="rounded-2xl border border-white/10 bg-xiio-surface/40 overflow-hidden">
          {loading && (
            <p className="px-4 py-8 text-sm text-xiio-muted text-center">{t("common.loading")}</p>
          )}
          {!loading && notifications.length === 0 && (
            <p className="px-4 py-8 text-sm text-xiio-muted text-center">{t("notifications.empty")}</p>
          )}
          {!loading && notifications.length > 0 && (
            <div className="divide-y divide-white/5">
              {notifications.map((n) => (
                <NotificationListItem key={n.id} notification={n} />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppPageShell>
  );
}
