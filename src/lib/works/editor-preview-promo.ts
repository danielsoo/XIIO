import type { PromoShort } from "@/types/promoShort";
import { normalizePromoFrameCrop } from "@/lib/works/promo-crop";
import type { PromoFrameCrop } from "@/types/work";

export function buildEditorPreviewPromoShort(opts: {
  title: string;
  description: string;
  thumbnailUrl?: string | null;
  frameCrop: PromoFrameCrop;
  videoUrl: string;
  director: string;
  ownerUid?: string;
  workId?: string;
}): PromoShort {
  return {
    id: "editor-preview",
    videoUrl: opts.videoUrl,
    thumbnailUrl: opts.thumbnailUrl?.trim() ? opts.thumbnailUrl.trim() : undefined,
    aspectRatio: 9 / 16,
    frameCrop: normalizePromoFrameCrop(opts.frameCrop),
    title: opts.title.trim() || "—",
    director: opts.director.trim() || "—",
    description: opts.description,
    ownerUid: opts.ownerUid,
    workId: opts.workId,
  };
}
