"use client";

import { useEffect, useState } from "react";
import AppPageShell from "@/components/layout/AppPageShell";
import NotificationListItem from "@/components/notifications/NotificationListItem";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/context/LocaleContext";
import type { NotificationListItem as NotificationListItemType } from "@/types/notification";

export default function NotificationsPage() {
  const { user } = useAuth();
  const { t } = useTranslations();
  const [notifications, setNotifications] = useState<NotificationListItemType[]>([]);
  const [loading, setLoading] = useState(true);

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
        <h1 className="text-xl font-bold text-white mb-4">{t("notifications.title")}</h1>
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
