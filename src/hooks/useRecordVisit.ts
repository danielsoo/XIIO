"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { getEngagementSessionId } from "@/lib/engagement-session";

const ACCOUNT_SESSION_KEY = "xiio_visit_recorded";
const PLATFORM_SESSION_KEY = "xiio_platform_visit_recorded";

function trafficSource(): "discover" | "direct" | "search" | "schools" | "external" {
  if (typeof window === "undefined") return "direct";
  const path = window.location.pathname;
  if (path.startsWith("/discover")) return "discover";
  if (path.startsWith("/schools")) return "schools";
  if (!document.referrer) return "direct";
  try {
    const referrer = new URL(document.referrer);
    if (referrer.origin === window.location.origin) return "direct";
    if (/google\.|bing\.|naver\.|daum\.|yahoo\.|duckduckgo\./i.test(referrer.hostname)) {
      return "search";
    }
  } catch {
    return "external";
  }
  return "external";
}

export function useRecordVisit() {
  const { user, loading } = useAuth();
  const started = useRef(false);

  useEffect(() => {
    if (loading || started.current) return;

    const accountRecorded =
      typeof sessionStorage !== "undefined" && sessionStorage.getItem(ACCOUNT_SESSION_KEY);
    const platformRecorded =
      typeof sessionStorage !== "undefined" && sessionStorage.getItem(PLATFORM_SESSION_KEY);
    if (platformRecorded && (!user || accountRecorded)) return;

    started.current = true;

    void (async () => {
      try {
        const token = user ? await user.getIdToken() : null;
        if (!platformRecorded) {
          const platformRes = await fetch("/api/analytics/visit", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({
              sessionId: getEngagementSessionId(),
              source: trafficSource(),
            }),
            keepalive: true,
          });
          if (platformRes.ok && typeof sessionStorage !== "undefined") {
            sessionStorage.setItem(PLATFORM_SESSION_KEY, "1");
          }
        }

        if (user && token && !accountRecorded) {
          const accountRes = await fetch("/api/me/visit", {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            keepalive: true,
          });
          if (accountRes.ok && typeof sessionStorage !== "undefined") {
            sessionStorage.setItem(ACCOUNT_SESSION_KEY, "1");
          }
        }
      } catch {
        started.current = false;
      }
    })();
  }, [user, loading]);
}
