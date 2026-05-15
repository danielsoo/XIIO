"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useAuth } from "@/context/AuthContext";
import {
  createWatchProfile,
  deleteWatchProfile,
  fetchWatchProfiles,
  updateWatchProfile,
} from "@/lib/watchProfiles";
import type { WatchProfile } from "@/types/profile";
import { MAX_WATCH_PROFILES } from "@/types/profile";

const ACTIVE_PROFILE_KEY = "xiio-active-watch-profile";

interface ProfileContextType {
  profiles: WatchProfile[];
  activeProfile: WatchProfile | null;
  loading: boolean;
  selectProfile: (profile: WatchProfile) => void;
  clearActiveProfile: () => void;
  refreshProfiles: () => Promise<void>;
  addProfile: (name: string, avatarFile?: File) => Promise<WatchProfile>;
  editProfile: (
    profileId: string,
    updates: { name?: string; avatarFile?: File }
  ) => Promise<WatchProfile>;
  removeProfile: (profileId: string) => Promise<void>;
  canAddProfile: boolean;
}

const ProfileContext = createContext<ProfileContextType | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<WatchProfile[]>([]);
  const [activeProfile, setActiveProfile] = useState<WatchProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const persistActive = (profile: WatchProfile | null) => {
    if (profile) {
      localStorage.setItem(ACTIVE_PROFILE_KEY, JSON.stringify(profile));
    } else {
      localStorage.removeItem(ACTIVE_PROFILE_KEY);
    }
    setActiveProfile(profile);
  };

  const clearActiveProfile = useCallback(() => {
    persistActive(null);
  }, []);

  const refreshProfiles = useCallback(async () => {
    if (!user) {
      setProfiles([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const list = await fetchWatchProfiles(user.uid);
      setProfiles(list);

      const stored = localStorage.getItem(ACTIVE_PROFILE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as WatchProfile;
        const match = list.find((p) => p.id === parsed.id);
        if (match) persistActive(match);
        else persistActive(null);
      }
    } catch {
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setProfiles([]);
      persistActive(null);
      setLoading(false);
      return;
    }
    void refreshProfiles();
  }, [user, refreshProfiles]);

  const selectProfile = (profile: WatchProfile) => {
    persistActive(profile);
  };

  const addProfile = async (name: string, avatarFile?: File) => {
    if (!user) throw new Error("로그인이 필요합니다.");
    const created = await createWatchProfile(user.uid, name, avatarFile);
    setProfiles((prev) => {
      if (prev.some((p) => p.id === created.id)) return prev;
      return [...prev, created];
    });
    void refreshProfiles();
    return created;
  };

  const editProfile = async (
    profileId: string,
    updates: { name?: string; avatarFile?: File }
  ) => {
    if (!user) throw new Error("로그인이 필요합니다.");
    const updated = await updateWatchProfile(user.uid, profileId, updates);
    setProfiles((prev) => prev.map((p) => (p.id === profileId ? updated : p)));
    if (activeProfile?.id === profileId) persistActive(updated);
    void refreshProfiles();
    return updated;
  };

  const removeProfile = async (profileId: string) => {
    if (!user) throw new Error("로그인이 필요합니다.");
    await deleteWatchProfile(user.uid, profileId);
    if (activeProfile?.id === profileId) persistActive(null);
    await refreshProfiles();
  };

  return (
    <ProfileContext.Provider
      value={{
        profiles,
        activeProfile,
        loading,
        selectProfile,
        clearActiveProfile,
        refreshProfiles,
        addProfile,
        editProfile,
        removeProfile,
        canAddProfile: profiles.length < MAX_WATCH_PROFILES,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used within ProfileProvider");
  return ctx;
}
