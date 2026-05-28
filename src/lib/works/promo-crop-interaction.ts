import { normalizePromoFrameCrop } from "@/lib/works/promo-crop";
import type { PromoFrameCrop } from "@/types/work";

export {
  adjustZoom,
  clampFrameToDisplay,
  computeObjectContainRect,
  cropToFrameRect,
  frameCenterToCrop,
  frameRectToCrop,
  maxPortraitFrameInRect,
  PORTRAIT_FRAME_ASPECT,
} from "@/lib/works/promo-crop-interaction-pure";

export type { Rect, Size, VideoLayout } from "@/lib/works/promo-crop-interaction-pure";

export function promoCropToVideoStyle(crop: PromoFrameCrop): {
  objectPosition: string;
  transform: string;
  transformOrigin: string;
} {
  const c = normalizePromoFrameCrop(crop);
  return {
    objectPosition: `${c.focalX}% ${c.focalY}%`,
    transform: `scale(${c.zoom})`,
    transformOrigin: `${c.focalX}% ${c.focalY}%`,
  };
}
