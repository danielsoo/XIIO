"use client";

import * as tus from "tus-js-client";

const CHUNK_SIZE = 50 * 1024 * 1024;

export type TusUploadOptions = {
  onProgress?: (percent: number) => void;
};

export function uploadFileViaTus(
  file: File,
  tusEndpoint: string,
  options?: TusUploadOptions
): Promise<void> {
  return new Promise((resolve, reject) => {
    const upload = new tus.Upload(file, {
      uploadUrl: tusEndpoint,
      chunkSize: CHUNK_SIZE,
      retryDelays: [0, 1000, 3000, 5000],
      onError: (error) => {
        reject(error instanceof Error ? error : new Error(String(error)));
      },
      onProgress: (bytesSent, bytesTotal) => {
        if (bytesTotal > 0 && options?.onProgress) {
          options.onProgress(Math.min(100, Math.round((bytesSent / bytesTotal) * 100)));
        }
      },
      onSuccess: () => resolve(),
    });
    upload.start();
  });
}
