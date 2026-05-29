"use client";

import { useEffect, useState } from "react";

export type ImageFileMetadata = {
  width: number;
  height: number;
};

/** Local image file or object URL — intrinsic dimensions */
export function useImageFileMetadata(source: File | string | null): ImageFileMetadata | null {
  const [meta, setMeta] = useState<ImageFileMetadata | null>(null);

  useEffect(() => {
    if (!source) {
      setMeta(null);
      return;
    }
    const url = typeof source === "string" ? source : URL.createObjectURL(source);
    const img = new Image();

    const onLoad = () => {
      const width = img.naturalWidth;
      const height = img.naturalHeight;
      if (width > 0 && height > 0) {
        setMeta({ width, height });
      } else {
        setMeta(null);
      }
      if (typeof source !== "string") URL.revokeObjectURL(url);
    };
    const onError = () => {
      setMeta(null);
      if (typeof source !== "string") URL.revokeObjectURL(url);
    };

    img.addEventListener("load", onLoad);
    img.addEventListener("error", onError);
    img.src = url;

    return () => {
      img.removeEventListener("load", onLoad);
      img.removeEventListener("error", onError);
      if (typeof source !== "string") URL.revokeObjectURL(url);
    };
  }, [source]);

  return meta;
}
