import type { User } from "firebase/auth";
import type { HeroBackgroundId } from "@/lib/heroBackgroundPresets";

export type SocietySummary = {
  displayName: string;
  handle: string | null;
  headline: string | null;
  bio: string | null;
  avatarUrl: string | null;
  schoolName: string | null;
  profileLink: string | null;
  societyBannerBackgroundId: HeroBackgroundId;
  stories: number;
  followers: number;
  following: number;
  totalViews: number;
};

type StoredSummary = {
  version: 1;
  savedAt: number;
  data: SocietySummary;
};

const STORAGE_PREFIX = "xiio:society-summary:v1:";
const STORAGE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const MEMORY_TTL_MS = 2 * 60 * 1000;
const memoryCache = new Map<string, { expiresAt: number; data: SocietySummary }>();
const inFlight = new Map<string, Promise<SocietySummary>>();

function storageKey(uid: string) {
  return `${STORAGE_PREFIX}${uid}`;
}

export function readStoredSocietySummary(uid: string): SocietySummary | null {
  const memory = memoryCache.get(uid);
  if (memory) return memory.data;
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(storageKey(uid));
    if (!raw) return null;
    const stored = JSON.parse(raw) as StoredSummary;
    if (
      stored.version !== 1 ||
      !stored.data ||
      !Number.isFinite(stored.savedAt) ||
      Date.now() - stored.savedAt > STORAGE_MAX_AGE_MS
    ) {
      localStorage.removeItem(storageKey(uid));
      return null;
    }
    return stored.data;
  } catch {
    return null;
  }
}

function storeSocietySummary(uid: string, data: SocietySummary) {
  memoryCache.set(uid, { data, expiresAt: Date.now() + MEMORY_TTL_MS });
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      storageKey(uid),
      JSON.stringify({ version: 1, savedAt: Date.now(), data } satisfies StoredSummary)
    );
  } catch {
    // Storage may be unavailable in private browsing; the memory cache still works.
  }
}

export async function fetchSocietySummary(user: User): Promise<SocietySummary> {
  const memory = memoryCache.get(user.uid);
  if (memory && memory.expiresAt > Date.now()) return memory.data;
  if (memory) memoryCache.delete(user.uid);

  const active = inFlight.get(user.uid);
  if (active) return active;

  const promise = (async () => {
    const token = await user.getIdToken();
    const response = await fetch("/api/me/society-summary", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error("society_summary_failed");
    const data = (await response.json()) as SocietySummary;
    storeSocietySummary(user.uid, data);
    return data;
  })().finally(() => inFlight.delete(user.uid));

  inFlight.set(user.uid, promise);
  return promise;
}
