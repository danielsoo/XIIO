"use client";

import { useCallback, useEffect, useState } from "react";
import CreditTagInput, { type TaggedCredit } from "@/components/network/CreditTagInput";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/context/LocaleContext";
import type { WorkCredit, WorkCreditInput } from "@/types/credits";

type CreditWithHandle = WorkCredit & { handle?: string | null };

type Props = {
  workId: string;
  disabled?: boolean;
};

export default function WorkCreditsSection({ workId, disabled }: Props) {
  const { user } = useAuth();
  const { t } = useTranslations();
  const [credits, setCredits] = useState<TaggedCredit[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const loadCredits = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setErr(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/me/works/${encodeURIComponent(workId)}/credits`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setErr(t("network.credits.loadError"));
        return;
      }
      const data = (await res.json()) as { credits?: CreditWithHandle[] };
      const tagged: TaggedCredit[] = (data.credits ?? []).map((c, i) => ({
        userId: c.userId,
        role: c.role,
        characterName: c.characterName,
        sortOrder: c.sortOrder ?? i,
        handle: c.handle ?? c.userId.slice(0, 8),
        displayName: c.displayName ?? c.handle ?? "",
      }));
      setCredits(tagged);
    } catch {
      setErr(t("network.credits.loadError"));
    } finally {
      setLoading(false);
    }
  }, [user, workId, t]);

  useEffect(() => {
    void loadCredits();
  }, [loadCredits]);

  const handleAddCredit = async (input: WorkCreditInput) => {
    if (!user) return;
    const token = await user.getIdToken();
    const res = await fetch(`/api/me/works/${encodeURIComponent(workId)}/credits`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });
    const data = (await res.json()) as { message?: string };
    if (!res.ok) {
      throw new Error(data.message ?? t("network.credits.addError"));
    }
    await loadCredits();
  };

  if (loading) {
    return <p className="text-xs text-xiio-muted">{t("common.loading")}</p>;
  }

  return (
    <div className="space-y-2">
      {err && <p className="text-xs text-red-400">{err}</p>}
      <CreditTagInput
        value={credits}
        onChange={setCredits}
        disabled={disabled}
        workId={workId}
        mode="published"
        onAddCredit={handleAddCredit}
      />
    </div>
  );
}
