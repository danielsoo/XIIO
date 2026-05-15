import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import type { WatchProfile } from "@/types/profile";
import {
  fileToDataUrl,
  loadLocalWatchProfiles,
  saveLocalWatchProfiles,
} from "@/lib/watchProfilesLocal";

const FIRESTORE_TIMEOUT_MS = 10000;
const STORAGE_TIMEOUT_MS = 15000;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(`${label}-timeout`)), ms);
    }),
  ]);
}

function profilesCol(uid: string) {
  if (!db) throw new Error("Firebase가 설정되지 않았습니다.");
  return collection(db, "users", uid, "watchProfiles");
}

function newLocalId() {
  return `local-${crypto.randomUUID()}`;
}

async function fetchFromCloud(uid: string): Promise<WatchProfile[]> {
  const snap = await withTimeout(getDocs(profilesCol(uid)), FIRESTORE_TIMEOUT_MS, "fetch-profiles");
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      name: data.name as string,
      avatarUrl: (data.avatarUrl as string | null) ?? null,
    };
  });
}

export async function fetchWatchProfiles(uid: string): Promise<WatchProfile[]> {
  const local = loadLocalWatchProfiles(uid);

  try {
    const cloud = await fetchFromCloud(uid);
    if (cloud.length > 0) {
      saveLocalWatchProfiles(uid, cloud);
      return cloud;
    }
    return local;
  } catch {
    return local;
  }
}

async function uploadWatchProfileAvatar(
  uid: string,
  profileId: string,
  file: File
): Promise<string> {
  if (!storage) throw new Error("Storage가 설정되지 않았습니다.");
  const ext = file.name.split(".").pop() || "jpg";
  const path = `users/${uid}/watchProfiles/${profileId}/avatar.${ext}`;
  const storageRef = ref(storage, path);
  await withTimeout(
    uploadBytes(storageRef, file, { contentType: file.type }),
    STORAGE_TIMEOUT_MS,
    "upload-avatar"
  );
  return getDownloadURL(storageRef);
}

function upsertLocal(uid: string, profile: WatchProfile) {
  const list = loadLocalWatchProfiles(uid);
  const idx = list.findIndex((p) => p.id === profile.id);
  if (idx >= 0) list[idx] = profile;
  else list.push(profile);
  saveLocalWatchProfiles(uid, list);
}

function removeLocal(uid: string, profileId: string) {
  saveLocalWatchProfiles(
    uid,
    loadLocalWatchProfiles(uid).filter((p) => p.id !== profileId)
  );
}

async function createInCloud(
  uid: string,
  name: string,
  avatarFile?: File
): Promise<WatchProfile> {
  const profileRef = doc(profilesCol(uid));
  const trimmedName = name.trim();

  await withTimeout(
    setDoc(profileRef, {
      name: trimmedName,
      avatarUrl: null,
      createdAt: serverTimestamp(),
    }),
    FIRESTORE_TIMEOUT_MS,
    "create-profile"
  );

  let avatarUrl: string | null = null;
  if (avatarFile) {
    avatarUrl = await uploadWatchProfileAvatar(uid, profileRef.id, avatarFile);
    await withTimeout(
      setDoc(profileRef, { avatarUrl, updatedAt: serverTimestamp() }, { merge: true }),
      FIRESTORE_TIMEOUT_MS,
      "update-avatar-url"
    );
  }

  return { id: profileRef.id, name: trimmedName, avatarUrl };
}

async function createInLocal(
  uid: string,
  name: string,
  avatarFile?: File
): Promise<WatchProfile> {
  const trimmedName = name.trim();
  let avatarUrl: string | null = null;
  if (avatarFile) {
    avatarUrl = await fileToDataUrl(avatarFile);
  }
  const profile: WatchProfile = { id: newLocalId(), name: trimmedName, avatarUrl };
  upsertLocal(uid, profile);
  return profile;
}

export async function createWatchProfile(
  uid: string,
  name: string,
  avatarFile?: File
): Promise<WatchProfile> {
  try {
    const created = await createInCloud(uid, name, avatarFile);
    upsertLocal(uid, created);
    return created;
  } catch {
    return createInLocal(uid, name, avatarFile);
  }
}

export async function updateWatchProfile(
  uid: string,
  profileId: string,
  updates: { name?: string; avatarFile?: File }
): Promise<WatchProfile> {
  const localExisting = loadLocalWatchProfiles(uid).find((p) => p.id === profileId);
  const isLocalOnly = profileId.startsWith("local-");

  if (isLocalOnly || !db) {
    const name = updates.name?.trim() ?? localExisting?.name ?? "프로필";
    let avatarUrl = localExisting?.avatarUrl ?? null;
    if (updates.avatarFile) avatarUrl = await fileToDataUrl(updates.avatarFile);
    const updated: WatchProfile = { id: profileId, name, avatarUrl };
    upsertLocal(uid, updated);
    return updated;
  }

  try {
    const profileRef = doc(profilesCol(uid), profileId);
    const payload: Record<string, unknown> = { updatedAt: serverTimestamp() };
    if (updates.name !== undefined) payload.name = updates.name.trim();

    let avatarUrl: string | undefined;
    if (updates.avatarFile) {
      avatarUrl = await uploadWatchProfileAvatar(uid, profileId, updates.avatarFile);
      payload.avatarUrl = avatarUrl;
    }

    await withTimeout(
      setDoc(profileRef, payload, { merge: true }),
      FIRESTORE_TIMEOUT_MS,
      "update-profile"
    );

    const cloud = (await fetchFromCloud(uid)).find((p) => p.id === profileId);
    const updated: WatchProfile = {
      id: profileId,
      name: updates.name?.trim() ?? cloud?.name ?? "프로필",
      avatarUrl: avatarUrl ?? cloud?.avatarUrl ?? null,
    };
    upsertLocal(uid, updated);
    return updated;
  } catch {
    const name = updates.name?.trim() ?? localExisting?.name ?? "프로필";
    let avatarUrl = localExisting?.avatarUrl ?? null;
    if (updates.avatarFile) avatarUrl = await fileToDataUrl(updates.avatarFile);
    const updated: WatchProfile = { id: profileId, name, avatarUrl };
    upsertLocal(uid, updated);
    return updated;
  }
}

export async function deleteWatchProfile(uid: string, profileId: string): Promise<void> {
  removeLocal(uid, profileId);

  if (profileId.startsWith("local-") || !db) return;

  try {
    if (storage) {
      try {
        await deleteObject(ref(storage, `users/${uid}/watchProfiles/${profileId}/avatar.jpg`));
      } catch {
        // ignore
      }
    }
    await withTimeout(
      deleteDoc(doc(profilesCol(uid), profileId)),
      FIRESTORE_TIMEOUT_MS,
      "delete-profile"
    );
  } catch {
    // 로컬 삭제만으로 충분
  }
}
