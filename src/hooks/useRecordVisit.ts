"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";

const SESSION_KEY = "xiio_visit_recorded";

export function useRecordVisit() {
  const { user, loading } = useAuth();
  const started = useRef(false);

  useEffect(() => {
    if (loading || !user || started.current) return;
    if (typeof sessionStorage !== "undefined" && sessionStorage.getItem(SESSION_KEY)) return;

    started.current = true;

    void (async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch("/api/me/visit", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok && typeof sessionStorage !== "undefined") {
          sessionStorage.setItem(SESSION_KEY, "1");
        }
      } catch {
        started.current = false;
      }
    })();
  }, [user, loading]);
}
