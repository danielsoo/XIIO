"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminAccess } from "@/hooks/useAdminAccess";

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
  const { checked: adminChecked, isAdmin } = useAdminAccess();

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

  useEffect(() => {
    if (!adminChecked || !isAdmin) return;

    // The admin console contains charts and review tools that make its first
    // development compile noticeably heavier than a catalog page. Warm it as
    // soon as access is confirmed so opening the profile menu stays instant.
    router.prefetch("/admin");
  }, [adminChecked, isAdmin, router]);

  return null;
}
