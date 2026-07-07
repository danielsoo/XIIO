"use client";

import { useCallback, useEffect, useState } from "react";
import BusinessInviteCard from "@/components/messages/BusinessInviteCard";
import { useDmInbox } from "@/components/messages/DmInboxContext";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/context/LocaleContext";
import type { BusinessInviteListItem } from "@/types/business-invite";

export default function BusinessInviteList() {
  const { user } = useAuth();
  const { t } = useTranslations();
  const { openBusinessInviteComposer } = useDmInbox();

  const [box, setBox] = useState<"received" | "sent">("received");
  const [invites, setInvites] = useState<BusinessInviteListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setInvites([]);
      setLoading(false);
      return;
    }
    const token = await user.getIdToken();
    const res = await fetch(`/api/me/business-invites?box=${box}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      setInvites([]);
      setLoading(false);
      return;
    }
    const data = (await res.json()) as { invites?: BusinessInviteListItem[] };
    setInvites(data.invites ?? []);
    setLoading(false);
  }, [user, box]);

  useEffect(() => {
    setLoading(true);
    void load();
    const id = setInterval(() => void load(), 15000);
    return () => clearInterval(id);
  }, [load]);

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center gap-2 px-4 py-2 shrink-0">
        <button
          type="button"
          onClick={() => setBox("received")}
          className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
            box === "received" ? "bg-white/10 text-white" : "text-xiio-muted hover:text-white"
          }`}
        >
          {t("dm.invites.receivedTab")}
        </button>
        <button
          type="button"
          onClick={() => setBox("sent")}
          className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
            box === "sent" ? "bg-white/10 text-white" : "text-xiio-muted hover:text-white"
          }`}
        >
          {t("dm.invites.sentTab")}
        </button>
        <button
          type="button"
          onClick={openBusinessInviteComposer}
          className="px-3 py-1.5 rounded-lg bg-xiio-accent text-white text-xs font-semibold shrink-0"
        >
          {t("dm.invites.composerTitle")}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {loading && <p className="text-sm text-xiio-muted text-center py-8">{t("common.loading")}</p>}
        {!loading && invites.length === 0 && (
          <p className="text-sm text-xiio-muted text-center py-8">
            {box === "received" ? t("dm.invites.emptyReceived") : t("dm.invites.emptySent")}
          </p>
        )}
        {invites.map((invite) => (
          <BusinessInviteCard key={invite.id} invite={invite} box={box} onChanged={() => void load()} />
        ))}
      </div>
    </div>
  );
}
