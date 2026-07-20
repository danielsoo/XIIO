import { normalizePromoFrameCrop } from "@/lib/works/promo-crop";
import { cropToObjectPosition } from "@/lib/works/promo-crop-interaction-pure";
import type { PromoFrameCrop } from "@/types/work";

export {
  adjustZoom,
  CATALOG_THUMBNAIL_FRAME_ASPECT,
  clampFrameToDisplay,
  computeObjectContainRect,
  cropToObjectPosition,
  cropToFrameRect,
  frameCenterToCrop,
  frameRectToCrop,
  maxFrameInRect,
  maxPortraitFrameInRect,
  PORTRAIT_FRAME_ASPECT,
} from "@/lib/works/promo-crop-interaction-pure";

export type { Rect, Size, VideoLayout } from "@/lib/works/promo-crop-interaction-pure";

export function promoCropToVideoStyle(
  crop: PromoFrameCrop,
  source?: { width: number; height: number; frameAspect?: number }
): {
  objectPosition: string;
  transform: string;
  transformOrigin: string;
} {
  const c = normalizePromoFrameCrop(crop);
  const position = source
    ? cropToObjectPosition(
        c,
        { width: source.width, height: source.height },
        source.frameAspect
      )
    : { x: c.focalX, y: c.focalY };
  return {
    objectPosition: `${position.x}% ${position.y}%`,
    transform: `scale(${c.zoom})`,
    transformOrigin: `${position.x}% ${position.y}%`,
  };
}
