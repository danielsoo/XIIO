"use client";

import type { WatchProfile } from "@/types/profile";

const AVATAR_COLORS = [
  "bg-violet-600",
  "bg-blue-600",
  "bg-emerald-600",
  "bg-amber-600",
  "bg-rose-600",
];

function colorForName(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function ProfileAvatar({
  profile,
  size = "md",
  className = "",
}: {
  profile: Pick<WatchProfile, "name" | "avatarUrl">;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const sizeClass = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-24 h-24 text-2xl",
    xl: "w-32 h-32 text-3xl",
  }[size];

  const initial = profile.name.trim().charAt(0) || "?";

  if (profile.avatarUrl) {
    return (
      <img
        src={profile.avatarUrl}
        alt={profile.name}
        className={`${sizeClass} rounded-full object-cover border-2 border-white/20 ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} ${colorForName(profile.name)} rounded-full flex items-center justify-center font-bold text-white border-2 border-white/20 ${className}`}
      aria-hidden
    >
      {initial}
    </div>
  );
}
