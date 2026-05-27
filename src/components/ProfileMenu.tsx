"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/context/LocaleContext";
import ProfileAvatar from "@/components/profile/ProfileAvatar";
import { getUserProfile } from "@/lib/userProfile";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import type { UserProfileDoc } from "@/types/user";

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
      />
    </svg>
  );
}

export default function ProfileMenu() {
  const { user, logout } = useAuth();
  const { isAdmin, checked: adminChecked } = useAdminAccess();
  const { t } = useTranslations();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [accountProfile, setAccountProfile] = useState<UserProfileDoc | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) {
      setAccountProfile(null);
      return;
    }
    let cancelled = false;
    void getUserProfile(user.uid).then((profile) => {
      if (!cancelled) setAccountProfile(profile);
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  if (!user) return null;

  const displayName = accountProfile?.displayName?.trim() || user.displayName || user.email || "—";
  const uploadLabel = t("profileMenu.uploadVideo");

  const handleLogout = async () => {
    await logout();
    router.push("/");
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative ml-auto flex items-center gap-2 sm:gap-3">
      <Link
        href="/uploader/upload"
        className="sm:hidden p-2 rounded-lg bg-xiio-accent hover:bg-xiio-accent-hover text-white transition shrink-0"
        aria-label={uploadLabel}
      >
        <UploadIcon className="w-5 h-5" />
      </Link>
      <Link
        href="/uploader/upload"
        className="hidden sm:inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-sm font-medium bg-xiio-accent hover:bg-xiio-accent-hover text-white transition shrink-0"
      >
        {uploadLabel}
      </Link>

      <div className="relative shrink-0">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="rounded-full ring-2 ring-transparent hover:ring-xiio-accent/60 transition focus:outline-none focus:ring-xiio-accent"
          aria-label={t("profileMenu.ariaLabel")}
          aria-expanded={open}
        >
          <ProfileAvatar
            displayName={displayName}
            avatarUrl={accountProfile?.avatarUrl}
            className="w-10 h-10 rounded-full bg-xiio-accent/20 ring-2 ring-xiio-accent/40 flex items-center justify-center text-sm font-bold text-white overflow-hidden shrink-0"
            imgClassName="w-full h-full object-cover"
          />
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-2 w-52 py-2 rounded-xl bg-xiio-surface border border-white/10 shadow-xl z-[60]">
            <div className="px-4 py-3 border-b border-white/10">
              <p className="text-sm font-medium text-white truncate">{displayName}</p>
              {accountProfile?.handle && (
                <p className="text-xs text-xiio-muted mt-0.5 truncate">@{accountProfile.handle}</p>
              )}
            </div>
            <Link
              href="/account"
              onClick={() => setOpen(false)}
              className="block w-full text-left px-4 py-2.5 text-sm text-white hover:bg-white/5 transition"
            >
              {t("profileMenu.accountProfile")}
            </Link>
            <Link
              href="/messages"
              onClick={() => setOpen(false)}
              className="block w-full text-left px-4 py-2.5 text-sm text-white hover:bg-white/5 transition"
            >
              {t("profileMenu.messages")}
            </Link>
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="block w-full text-left px-4 py-2.5 text-sm text-white hover:bg-white/5 transition"
            >
              {t("profileMenu.settings")}
            </Link>
            <Link
              href="/uploader/works"
              onClick={() => setOpen(false)}
              className="block w-full text-left px-4 py-2.5 text-sm text-white hover:bg-white/5 transition"
            >
              {t("profileMenu.myWorks")}
            </Link>
            <Link
              href="/uploader/analytics"
              onClick={() => setOpen(false)}
              className="block w-full text-left px-4 py-2.5 text-sm text-white hover:bg-white/5 transition"
            >
              {t("profileMenu.myAnalytics")}
            </Link>
            {adminChecked && isAdmin && (
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="block w-full text-left px-4 py-2.5 text-sm text-xiio-accent hover:bg-white/5 transition"
              >
                {t("profileMenu.adminPanel")}
              </Link>
            )}
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-white/5 transition border-t border-white/10 mt-1"
            >
              {t("profileMenu.logout")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
