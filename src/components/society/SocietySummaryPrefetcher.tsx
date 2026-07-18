"use client";

import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { fetchSocietySummary } from "@/lib/societySummaryCache";
import { loadFollowingUids } from "@/lib/societyPeopleCache";

export default function SocietySummaryPrefetcher() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading || !user) return;
    void Promise.all([fetchSocietySummary(user), loadFollowingUids(user)]).catch(() => {});
  }, [loading, user]);

  return null;
}
