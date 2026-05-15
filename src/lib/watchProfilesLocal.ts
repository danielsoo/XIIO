import type { WatchProfile } from "@/types/profile";

function storageKey(uid: string) {
  return `xiio-watch-profiles-${uid}`;
}

export function loadLocalWatchProfiles(uid: string): WatchProfile[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(uid));
    if (!raw) return [];
    return JSON.parse(raw) as WatchProfile[];
  } catch {
    return [];
  }
}

export function saveLocalWatchProfiles(uid: string, profiles: WatchProfile[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(storageKey(uid), JSON.stringify(profiles));
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("file-read-failed"));
    reader.readAsDataURL(file);
  });
}
