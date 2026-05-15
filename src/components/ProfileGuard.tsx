"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useProfile } from "@/context/ProfileContext";

const EXEMPT_PATHS = ["/login", "/signup", "/profiles", "/settings"];

export default function ProfileGuard() {
  const { user, loading: authLoading } = useAuth();
  const { activeProfile, loading: profileLoading } = useProfile();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (authLoading || profileLoading) return;
    if (!user) return;
    if (EXEMPT_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return;
    if (!activeProfile) router.replace("/profiles");
  }, [user, activeProfile, authLoading, profileLoading, pathname, router]);

  return null;
}
