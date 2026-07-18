"use client";

import { useCallback, useRef } from "react";
import { useAuth } from "@/context/AuthContext";

const REPORT_INTERVAL_MS = 10_000;

export function useWatchProgressReporter(ownerUid: string, workId: string) {
  const { user } = useAuth();
  const lastSentAt = useRef(0);
  const lastPosition = useRef(0);

  const send = useCallback(
    async (positionSec: number, durationSec: number) => {
      if (!user || !durationSec || !Number.isFinite(positionSec)) return;
      try {
        const token = await user.getIdToken();
        await fetch("/api/me/watch-progress", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ ownerUid, workId, positionSec, durationSec }),
          keepalive: true,
        });
      } catch {
        // best-effort; progress tracking should never interrupt playback
      }
    },
    [ownerUid, user, workId]
  );

  const report = useCallback(
    (positionSec: number, durationSec: number, opts?: { force?: boolean }) => {
      lastPosition.current = positionSec;
      const now = Date.now();
      if (!opts?.force && now - lastSentAt.current < REPORT_INTERVAL_MS) return;
      lastSentAt.current = now;
      void send(positionSec, durationSec);
    },
    [send]
  );

  const flush = useCallback(
    (durationSec: number) => {
      void send(lastPosition.current, durationSec);
    },
    [send]
  );

  return { report, flush };
}
