import { getDownloadURL, ref } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { uploadBlobWithProgress } from "@/lib/works/storage-upload";
import type { PromoFrameCrop } from "@/types/work";

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
  file: File,
  onProgress?: (ratio: number) => void
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
  await uploadBlobWithProgress(storageRef, file, { contentType: file.type || "image/jpeg" }, onProgress);
  return getDownloadURL(storageRef);
}

export type PatchPromoThumbnailPayload = {
  thumbnailUrl?: string;
  thumbnailCrop?: PromoFrameCrop;
};

export async function patchPromoThumbnailUrl(
  token: string,
  workId: string,
  payload: PatchPromoThumbnailPayload | string
): Promise<void> {
  const body: PatchPromoThumbnailPayload =
    typeof payload === "string" ? { thumbnailUrl: payload } : payload;
  const res = await fetch(`/api/me/works/${workId}/promo-thumbnail`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text.slice(0, 300) || `HTTP ${res.status}`);
  }
}
