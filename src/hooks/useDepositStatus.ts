"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

export function useDepositStatus() {
  const { user, loading: authLoading } = useAuth();
  const [depositVerified, setDepositVerified] = useState(false);
  const [depositEnabled, setDepositEnabled] = useState(false);
  const [checked, setChecked] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setDepositVerified(false);
      setDepositEnabled(false);
      setChecked(true);
      return;
    }
    try {
      const token = await user.getIdToken(true);
      const res = await fetch("/api/me/deposit-status", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await res.json()) as {
        depositVerified?: boolean;
        uploaderDepositEnabled?: boolean;
      };
      setDepositVerified(!!data.depositVerified);
      setDepositEnabled(!!data.uploaderDepositEnabled);
    } catch {
      setDepositVerified(false);
    } finally {
      setChecked(true);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    void refresh();
  }, [authLoading, refresh]);

  return { depositVerified, depositEnabled, checked, refresh, authLoading };
}
