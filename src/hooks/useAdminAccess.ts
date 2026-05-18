"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

export type AdminCheckReason = "unauthorized" | "admin_sdk_missing" | undefined;

export function useAdminAccess() {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [checked, setChecked] = useState(false);
  const [reason, setReason] = useState<AdminCheckReason>(undefined);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setIsAdmin(false);
      setIsSuperAdmin(false);
      setReason(undefined);
      setChecked(true);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch("/api/admin/check", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = (await res.json()) as {
          ok?: boolean;
          isAdmin?: boolean;
          isSuperAdmin?: boolean;
          reason?: AdminCheckReason;
        };
        if (cancelled) return;
        if (res.status === 503 && data.reason === "admin_sdk_missing") {
          setReason("admin_sdk_missing");
          setIsAdmin(false);
          setIsSuperAdmin(false);
          return;
        }
        setReason(undefined);
        setIsAdmin(!!data.isAdmin);
        setIsSuperAdmin(!!data.isSuperAdmin);
      } catch {
        if (!cancelled) {
          setIsAdmin(false);
          setIsSuperAdmin(false);
          setReason(undefined);
        }
      } finally {
        if (!cancelled) setChecked(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  return { isAdmin, isSuperAdmin, checked, reason, authLoading };
}
