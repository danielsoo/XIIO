"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { getEngagementSessionId } from "@/lib/engagement-session";
import type { EngagementTarget } from "@/types/engagement";

export function useRecordEngagementView(
  ownerUid: string | undefined,
  workId: string | undefined,
  target: EngagementTarget,
  active: boolean
) {
  const { user } = useAuth();
  const recordedRef = useRef(false);

  useEffect(() => {
    recordedRef.current = false;
  }, [ownerUid, workId, target]);

  useEffect(() => {
    if (!active || !ownerUid || !workId || recordedRef.current) return;

    let cancelled = false;
    (async () => {
      try {
        const headers: HeadersInit = { "Content-Type": "application/json" };
        if (user) {
          const token = await user.getIdToken();
          headers.Authorization = `Bearer ${token}`;
        }
        const res = await fetch("/api/engagement/view", {
          method: "POST",
          headers,
          body: JSON.stringify({
            ownerUid,
            workId,
            target,
            sessionId: getEngagementSessionId(),
          }),
        });
        if (!cancelled && res.ok) recordedRef.current = true;
      } catch {
        /* ignore */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [active, ownerUid, workId, target, user]);
}
