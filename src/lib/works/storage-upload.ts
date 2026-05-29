import { ref, uploadBytesResumable, type UploadMetadata, type StorageReference } from "firebase/storage";

/** Resumable Firebase Storage upload with byte progress (0–1). */
export async function uploadBlobWithProgress(
  storageRef: StorageReference,
  data: Blob,
  metadata: UploadMetadata | undefined,
  onProgress?: (ratio: number) => void
): Promise<void> {
  const task = uploadBytesResumable(storageRef, data, metadata);
  await new Promise<void>((resolve, reject) => {
    task.on(
      "state_changed",
      (snapshot) => {
        const total = snapshot.totalBytes;
        const ratio = total > 0 ? snapshot.bytesTransferred / total : 0;
        onProgress?.(ratio);
      },
      reject,
      () => resolve()
    );
  });
}
