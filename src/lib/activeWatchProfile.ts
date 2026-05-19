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

/** 계정 프로필 완료 후: 저장된 시청 프로필이 있으면 홈, 없으면 선택 화면 */
export function resolvePostLoginPath(
  uid: string,
  incompleteAccountPath: "/signup" | "/profiles"
): "/" | "/signup" | "/profiles" {
  if (incompleteAccountPath === "/signup") return "/signup";
  if (hasStoredActiveWatchProfile(uid)) return "/";
  return "/profiles";
}
