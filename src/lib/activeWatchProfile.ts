import type { WatchProfile } from "@/types/profile";

const LEGACY_KEY = "xiio-active-watch-profile";

function storageKey(uid: string) {
  return `xiio-active-watch-profile-${uid}`;
}

export function loadStoredActiveWatchProfile(uid: string): WatchProfile | null {
  if (typeof window === "undefined") return null;
  try {
    let raw = localStorage.getItem(storageKey(uid));
    if (!raw) {
      const legacy = localStorage.getItem(LEGACY_KEY);
      if (legacy) {
        localStorage.setItem(storageKey(uid), legacy);
        localStorage.removeItem(LEGACY_KEY);
        raw = legacy;
      }
    }
    if (!raw) return null;
    return JSON.parse(raw) as WatchProfile;
  } catch {
    return null;
  }
}

export function saveStoredActiveWatchProfile(uid: string, profile: WatchProfile | null) {
  if (typeof window === "undefined") return;
  if (profile) {
    localStorage.setItem(storageKey(uid), JSON.stringify(profile));
  } else {
    localStorage.removeItem(storageKey(uid));
  }
}

export function hasStoredActiveWatchProfile(uid: string): boolean {
  return loadStoredActiveWatchProfile(uid) !== null;
}

/** 계정 프로필 완료 후 홈, 미완료 시 가입·설정 흐름 */
export function resolvePostLoginPath(
  _uid: string,
  incompleteAccountPath: "/signup" | "/"
): "/" | "/signup" {
  if (incompleteAccountPath === "/signup") return "/signup";
  return "/";
}
