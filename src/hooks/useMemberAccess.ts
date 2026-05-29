"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { isUploaderAppRoute } from "@/lib/uploader-routes";
import {
  resolveMemberAccess,
  type MemberAccessResult,
  parseUserProfileDoc,
} from "@/lib/userAccess";
import type { UserProfileDoc } from "@/types/user";

export function useMemberAccess() {
  const { user, loading: authLoading } = useAuth();
  const pathname = usePathname();
  const skipClientFirestore = isUploaderAppRoute(pathname);
  const [access, setAccess] = useState<MemberAccessResult>({ kind: "none" });
  const [profile, setProfile] = useState<UserProfileDoc | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (skipClientFirestore) {
      if (user) {
        setAccess({ kind: "active" });
        setProfile(null);
      } else {
        setAccess({ kind: "none" });
        setProfile(null);
      }
      setChecked(true);
      return;
    }

    if (!user || !db) {
      setAccess({ kind: "none" });
      setProfile(null);
      setChecked(true);
      return;
    }

    setChecked(false);
    const ref = doc(db, "users", user.uid);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        const result = resolveMemberAccess(
          snap.exists(),
          snap.exists() ? (snap.data() as Record<string, unknown>) : undefined
        );
        setAccess(result);
        setProfile(
          snap.exists() ? parseUserProfileDoc(snap.data() as Record<string, unknown>) : null
        );
        setChecked(true);
      },
      () => {
        setAccess({ kind: "no_profile" });
        setProfile(null);
        setChecked(true);
      }
    );

    return () => unsub();
  }, [user, authLoading, skipClientFirestore]);

  return {
    access,
    profile,
    checked,
    authLoading,
    hasProfile: access.kind === "active",
    needsProfile: access.kind === "no_profile",
  };
}
