"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useMemberAccess } from "@/hooks/useMemberAccess";

const EXEMPT_PATHS = ["/login", "/signup", "/admin"];

/** Firestore 프로필 없으면 가입 플로우로 (승인 대기 없음 — 넷플릭스형) */
export default function MemberGuard() {
  const { user, loading: authLoading } = useAuth();
  const { access, checked } = useMemberAccess();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (authLoading || !checked || !user) return;
    if (EXEMPT_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return;

    if (access.kind === "no_profile") {
      router.replace("/signup");
    }
  }, [access, authLoading, checked, user, pathname, router]);

  return null;
}
