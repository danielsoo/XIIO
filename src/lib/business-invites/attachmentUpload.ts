import { getDownloadURL, ref } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { uploadBlobWithProgress } from "@/lib/works/storage-upload";

export const MAX_BUSINESS_INVITE_ATTACHMENT_BYTES = 20 * 1024 * 1024;

const ALLOWED_CONTENT_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export function validateBusinessInviteAttachmentFile(file: File): "type" | "size" | null {
  const isAllowedType =
    file.type.startsWith("image/") || ALLOWED_CONTENT_TYPES.includes(file.type);
  if (!isAllowedType) return "type";
  if (file.size > MAX_BUSINESS_INVITE_ATTACHMENT_BYTES) return "size";
  return null;
}

export type BusinessInviteAttachmentUploadResult = {
  attachmentUrl: string;
  attachmentFileName: string;
  attachmentContentType: string;
};

/**
 * uploadToken is a client-generated id (e.g. crypto.randomUUID()) used only to namespace the
 * storage path — the invite doc doesn't exist yet at upload time, so it does not need to match
 * the eventual Firestore invite id.
 */
export async function uploadBusinessInviteAttachment(
  uid: string,
  uploadToken: string,
  file: File,
  onProgress?: (ratio: number) => void
): Promise<BusinessInviteAttachmentUploadResult> {
  if (!storage) {
    throw new Error("storage_not_configured");
  }
  const err = validateBusinessInviteAttachmentFile(file);
  if (err === "type") throw new Error("attachment_invalid_type");
  if (err === "size") throw new Error("attachment_too_large");

  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const path = `users/${uid}/business-invites/${uploadToken}/attachment.${ext}`;
  const storageRef = ref(storage, path);
  await uploadBlobWithProgress(
    storageRef,
    file,
    { contentType: file.type || "application/octet-stream" },
    onProgress
  );
  const attachmentUrl = await getDownloadURL(storageRef);
  return {
    attachmentUrl,
    attachmentFileName: file.name,
    attachmentContentType: file.type || "application/octet-stream",
  };
}
