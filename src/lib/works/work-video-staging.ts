import { getDownloadURL, ref } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { MAX_STREAM_UPLOAD_BYTES } from "@/lib/cloudflare/stream";
import { uploadBlobWithProgress } from "@/lib/works/storage-upload";

export type StagingKind = "full" | "promo";

const SAFE_VIDEO_EXT = ["mp4", "mov", "webm", "mkv"] as const;

export function safeVideoExt(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase() || "mp4";
  return (SAFE_VIDEO_EXT as readonly string[]).includes(ext) ? ext : "mp4";
}

export function stagingObjectPath(uid: string, workId: string, kind: StagingKind, ext: string): string {
  return `users/${uid}/works/${workId}/staging/${kind}.${ext}`;
}

export function validateStagingVideoFile(file: File): "type" | "size" | null {
  if (!file.type.startsWith("video/") && !/\.(mp4|mov|webm|mkv)$/i.test(file.name)) {
    return "type";
  }
  if (file.size > MAX_STREAM_UPLOAD_BYTES) return "size";
  return null;
}

export async function uploadStagingVideo(
  uid: string,
  workId: string,
  kind: StagingKind,
  file: File,
  onProgress?: (ratio: number) => void
): Promise<{ path: string; bytes: number; contentType: string }> {
  if (!storage) throw new Error("storage_not_configured");
  const err = validateStagingVideoFile(file);
  if (err === "type") throw new Error("staging_invalid_type");
  if (err === "size") throw new Error("staging_too_large");

  const ext = safeVideoExt(file.name);
  const path = stagingObjectPath(uid, workId, kind, ext);
  const storageRef = ref(storage, path);
  const contentType = file.type || "video/mp4";
  await uploadBlobWithProgress(storageRef, file, { contentType }, onProgress);
  return { path, bytes: file.size, contentType };
}

export async function getStagingDownloadUrl(path: string): Promise<string> {
  if (!storage) throw new Error("storage_not_configured");
  return getDownloadURL(ref(storage, path));
}

export async function fetchStagingFile(path: string): Promise<File> {
  const url = await getStagingDownloadUrl(path);
  const res = await fetch(url);
  if (!res.ok) throw new Error("staging_fetch_failed");
  const blob = await res.blob();
  const name = path.split("/").pop() ?? "video.mp4";
  return new File([blob], name, { type: blob.type || "video/mp4" });
}
