import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";

const STORAGE_TIMEOUT_MS = 15000;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(`${label}-timeout`)), ms);
    }),
  ]);
}

export async function uploadUserProfileAvatar(uid: string, file: File): Promise<string> {
  if (!storage) throw new Error("Storage가 설정되지 않았습니다.");
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const safeExt = ["jpg", "jpeg", "png", "webp", "gif"].includes(ext) ? ext : "jpg";
  const path = `users/${uid}/profile/avatar.${safeExt}`;
  const storageRef = ref(storage, path);
  await withTimeout(
    uploadBytes(storageRef, file, { contentType: file.type || "image/jpeg" }),
    STORAGE_TIMEOUT_MS,
    "upload-profile-avatar"
  );
  return getDownloadURL(storageRef);
}

export async function persistUserProfileAvatarUrl(
  uid: string,
  avatarUrl: string | null
): Promise<void> {
  if (!db) throw new Error("Firebase가 설정되지 않았습니다.");
  await setDoc(
    doc(db, "users", uid),
    {
      avatarUrl: avatarUrl ?? null,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}
