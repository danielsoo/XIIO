"use client";

import { useCallback, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { getEngagementSessionId } from "@/lib/engagement-session";

const REPORT_INTERVAL_MS = 10_000;

export function useWatchProgressReporter(ownerUid: string, workId: string) {
  const { user } = useAuth();
  const lastSentAt = useRef(0);
  const lastPosition = useRef(0);
  const lastResolutionHeight = useRef<number | null>(null);

  const send = useCallback(
    async (
      positionSec: number,
      durationSec: number,
      isPlaying: boolean,
      resolutionHeight: number | null
    ) => {
      if (!durationSec || !Number.isFinite(positionSec)) return;
      try {
        const token = user ? await user.getIdToken() : null;
        const headers: HeadersInit = {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };

        const analyticsRequest = fetch("/api/analytics/watch", {
          method: "POST",
          headers,
          body: JSON.stringify({
            ownerUid,
            workId,
            positionSec,
            durationSec,
            resolutionHeight,
            isPlaying,
            sessionId: getEngagementSessionId(),
          }),
          keepalive: true,
        });

        const progressRequest =
          user && token
            ? fetch("/api/me/watch-progress", {
                method: "POST",
                headers,
                body: JSON.stringify({ ownerUid, workId, positionSec, durationSec }),
                keepalive: true,
              })
            : Promise.resolve(null);

        await Promise.allSettled([analyticsRequest, progressRequest]);
      } catch {
        // Best-effort analytics must never interrupt playback.
      }
    },
    [ownerUid, user, workId]
  );

  const report = useCallback(
    (
      positionSec: number,
      durationSec: number,
      opts?: { force?: boolean; isPlaying?: boolean; resolutionHeight?: number | null }
    ) => {
      lastPosition.current = positionSec;
      if (opts?.resolutionHeight !== undefined) {
        lastResolutionHeight.current = opts.resolutionHeight;
      }
      const now = Date.now();
      if (!opts?.force && now - lastSentAt.current < REPORT_INTERVAL_MS) return;
      lastSentAt.current = now;
      void send(
        positionSec,
        durationSec,
        opts?.isPlaying ?? true,
        lastResolutionHeight.current
      );
    },
    [send]
  );

  const flush = useCallback(
    (durationSec: number) => {
      void send(lastPosition.current, durationSec, false, lastResolutionHeight.current);
    },
    [send]
  );

  return { report, flush };
}
