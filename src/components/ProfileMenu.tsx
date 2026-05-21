"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useProfile } from "@/context/ProfileContext";
import { useTranslations } from "@/context/LocaleContext";
import ProfileAvatar from "@/components/ProfileAvatar";
import { useAdminAccess } from "@/hooks/useAdminAccess";

export default function ProfileMenu() {
  const { logout } = useAuth();
  const { activeProfile, clearActiveProfile } = useProfile();
  const { isAdmin, checked: adminChecked } = useAdminAccess();
  const { t } = useTranslations();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  if (!activeProfile) return null;

  const handleLogout = async () => {
    await logout();
    router.push("/");
    setOpen(false);
  };

  const handleSwitchProfile = () => {
    clearActiveProfile();
    router.push("/profiles");
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative ml-auto">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="rounded-full ring-2 ring-transparent hover:ring-xiio-accent/60 transition focus:outline-none focus:ring-xiio-accent"
        aria-label={t("profileMenu.ariaLabel")}
        aria-expanded={open}
      >
        <ProfileAvatar profile={activeProfile} size="md" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 py-2 rounded-xl bg-xiio-surface border border-white/10 shadow-xl z-[60]">
          <div className="px-4 py-3 border-b border-white/10">
            <p className="text-sm font-medium text-white truncate">{activeProfile.name}</p>
            <p className="text-xs text-xiio-muted mt-0.5">{t("profileMenu.watchProfile")}</p>
          </div>
          <Link
            href="/account"
            onClick={() => setOpen(false)}
            className="block w-full text-left px-4 py-2.5 text-sm text-white hover:bg-white/5 transition"
          >
            {t("profileMenu.accountProfile")}
          </Link>
          <button
            type="button"
            onClick={handleSwitchProfile}
            className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-white/5 transition"
          >
            {t("profileMenu.switchProfile")}
          </button>
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
          <Link
            href="/uploader/upload"
            onClick={() => setOpen(false)}
            className="block w-full text-left px-4 py-2.5 text-sm text-white hover:bg-white/5 transition"
          >
            {t("profileMenu.uploadVideo")}
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
  );
}
