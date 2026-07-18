"use client";

import { useEffect } from "react";
import { loadCatalogFeed, loadSchoolsFeed } from "@/lib/clientFeedLoaders";
import { loadSocietyPeople } from "@/lib/societyPeopleCache";

export default function PublicFeedPrefetcher() {
  useEffect(() => {
    const connection = (navigator as Navigator & {
      connection?: { saveData?: boolean };
    }).connection;
    if (connection?.saveData) return;

    const warmFeeds = () => {
      if (document.visibilityState !== "visible") return;
      void Promise.all([
        loadCatalogFeed("movies", 12),
        loadCatalogFeed("series", 12),
        loadCatalogFeed("entertainment", 12),
        loadSchoolsFeed(50),
        loadSocietyPeople(null),
      ]).catch(() => {});
    };

    const timer = window.setTimeout(warmFeeds, 700);
    return () => window.clearTimeout(timer);
  }, []);

  return null;
}
