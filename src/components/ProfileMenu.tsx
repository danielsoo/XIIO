"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useProfile } from "@/context/ProfileContext";
import ProfileAvatar from "@/components/ProfileAvatar";

export default function ProfileMenu() {
  const { logout } = useAuth();
  const { activeProfile, clearActiveProfile } = useProfile();
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
    clearActiveProfile();
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
        aria-label="프로필 메뉴"
        aria-expanded={open}
      >
        <ProfileAvatar profile={activeProfile} size="md" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 py-2 rounded-xl bg-xiio-surface border border-white/10 shadow-xl z-[60]">
          <div className="px-4 py-3 border-b border-white/10">
            <p className="text-sm font-medium text-white truncate">{activeProfile.name}</p>
            <p className="text-xs text-xiio-muted mt-0.5">시청 프로필</p>
          </div>
          <button
            type="button"
            onClick={handleSwitchProfile}
            className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-white/5 transition"
          >
            프로필 변경
          </button>
          <Link
            href="/settings"
            onClick={() => setOpen(false)}
            className="block w-full text-left px-4 py-2.5 text-sm text-white hover:bg-white/5 transition"
          >
            설정
          </Link>
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-white/5 transition border-t border-white/10 mt-1"
          >
            로그아웃
          </button>
        </div>
      )}
    </div>
  );
}
