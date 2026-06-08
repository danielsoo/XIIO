"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";

const HEARTBEAT_MS = 60_000;

async function sendPresence(token: string): Promise<boolean> {
  try {
    const res = await fetch("/api/me/presence", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function usePresenceHeartbeat() {
  const { user, loading } = useAuth();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (loading || !user) return;

    const ping = () => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      void user.getIdToken().then((token) => sendPresence(token));
    };

    ping();

    intervalRef.current = setInterval(ping, HEARTBEAT_MS);

    const onVisibility = () => {
      if (document.visibilityState === "visible") ping();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [user, loading]);
}
