import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "@/lib/firebase";

/** 홍보 썸네일 최대 용량 — storage.rules 와 동일하게 유지 */
export const MAX_PROMO_THUMBNAIL_BYTES = 10 * 1024 * 1024;

export function validatePromoThumbnailFile(file: File): "type" | "size" | null {
  if (!file.type.startsWith("image/")) return "type";
  if (file.size > MAX_PROMO_THUMBNAIL_BYTES) return "size";
  return null;
}

export async function uploadPromoThumbnail(
  uid: string,
  workId: string,
  file: File
): Promise<string> {
  if (!storage) {
    throw new Error("storage_not_configured");
  }
  const err = validatePromoThumbnailFile(file);
  if (err === "type") throw new Error("thumbnail_invalid_type");
  if (err === "size") throw new Error("thumbnail_too_large");

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const safeExt = ["jpg", "jpeg", "png", "webp", "gif"].includes(ext) ? ext : "jpg";
  const path = `users/${uid}/works/${workId}/promo-thumbnail.${safeExt}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file, { contentType: file.type || "image/jpeg" });
  return getDownloadURL(storageRef);
}

export async function patchPromoThumbnailUrl(
  token: string,
  workId: string,
  thumbnailUrl: string
): Promise<void> {
  const res = await fetch(`/api/me/works/${workId}/promo-thumbnail`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ thumbnailUrl }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text.slice(0, 300) || `HTTP ${res.status}`);
  }
}
