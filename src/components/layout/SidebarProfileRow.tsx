"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/context/LocaleContext";
import ProfileAvatar from "@/components/ProfileAvatar";
import { IconChevronDown } from "@/components/icons/MockupIcons";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { getUserProfile } from "@/lib/userProfile";
import type { UserProfileDoc } from "@/types/user";

export default function SidebarProfileRow({ onNavigate }: { onNavigate?: () => void }) {
  const { user, logout } = useAuth();
  const { isAdmin, checked: adminChecked } = useAdminAccess();
  const { t } = useTranslations();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfileDoc | null>(null);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }
    let cancelled = false;
    void getUserProfile(user.uid).then((p) => {
      if (!cancelled) setProfile(p);
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  if (!user) {
    return (
      <Link
        href="/login"
        prefetch={false}
        onClick={onNavigate}
        className="block mx-2 text-center py-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-sm font-semibold"
      >
        {t("common.login")}
      </Link>
    );
  }

  const handle = profile?.handle?.trim() || user.email?.split("@")[0] || "guest";
  const displayName = profile?.displayName?.trim() || user.displayName || handle;

  const go = (href: string) => {
    setOpen(false);
    onNavigate?.();
    router.push(href);
  };

  return (
    <div ref={ref} className="relative px-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2.5 px-2.5 py-3 rounded-lg hover:bg-white/5 transition text-left"
        aria-expanded={open}
      >
        <ProfileAvatar profile={{ name: displayName, avatarUrl: profile?.avatarUrl ?? null }} size="sm" />
        <span className="flex-1 text-sm text-white/85 truncate">{handle}</span>
        <IconChevronDown className={`w-4 h-4 text-white/45 transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open ? (
        <div className="animate-dropdown-in absolute bottom-full left-2 right-2 mb-1 py-1 rounded-lg border border-white/10 bg-xiio-card shadow-xl z-50">
          <button
            type="button"
            onClick={() => go("/account")}
            className="w-full text-left px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5"
          >
            {t("profileMenu.accountProfile")}
          </button>
          <button
            type="button"
            onClick={() => go("/settings")}
            className="w-full text-left px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5"
          >
            {t("profileMenu.settings")}
          </button>
          {adminChecked && isAdmin ? (
            <button
              type="button"
              onClick={() => go("/admin")}
              className="w-full text-left px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5"
            >
              {t("profileMenu.adminPanel")}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => void logout().then(() => router.push("/"))}
            className="w-full text-left px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5 border-t border-white/10 mt-1"
          >
            {t("profileMenu.logout")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
