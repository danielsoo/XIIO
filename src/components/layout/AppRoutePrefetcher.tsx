"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const CORE_APP_ROUTES = [
  "/",
  "/discover",
  "/movies",
  "/series",
  "/entertainment",
  "/schools",
  "/society",
  "/my-list",
] as const;

export default function AppRoutePrefetcher() {
  const router = useRouter();

  useEffect(() => {
    const connection = (navigator as Navigator & {
      connection?: { saveData?: boolean };
    }).connection;
    if (connection?.saveData) return;

    const warmRoutes = () => {
      if (document.visibilityState !== "visible") return;
      CORE_APP_ROUTES.forEach((href) => router.prefetch(href));
    };

    const timer = window.setTimeout(warmRoutes, 600);
    return () => window.clearTimeout(timer);
  }, [router]);

  return null;
}
