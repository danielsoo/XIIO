/** Node 테스트·번들 공용 — 외부 import 없음 */

export type PromoFrameCropPure = {
  focalX: number;
  focalY: number;
  zoom: number;
};

export const PROMO_CROP_MIN_ZOOM = 1;
export const PROMO_CROP_MAX_ZOOM = 2.5;

/** 9:16 portrait frame — width / height */
export const PORTRAIT_FRAME_ASPECT = 9 / 16;

/** 16:9 catalog thumbnail frame — width / height */
export const CATALOG_THUMBNAIL_FRAME_ASPECT = 16 / 9;

export type Size = { width: number; height: number };
export type Rect = { left: number; top: number; width: number; height: number };

export type VideoLayout = {
  containerWidth: number;
  containerHeight: number;
  videoWidth: number;
  videoHeight: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 50;
  return Math.min(100, Math.max(0, value));
}

function clampZoom(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.min(PROMO_CROP_MAX_ZOOM, Math.max(PROMO_CROP_MIN_ZOOM, value));
}

export function normalizePromoFrameCropPure(crop: PromoFrameCropPure): PromoFrameCropPure {
  return {
    focalX: clampPercent(crop.focalX),
    focalY: clampPercent(crop.focalY),
    zoom: clampZoom(crop.zoom),
  };
}

/** object-contain 영상이 실제로 그려지는 영역 (letterbox 제외) */
export function computeObjectContainRect(layout: VideoLayout): Rect {
  const { containerWidth: cw, containerHeight: ch, videoWidth: vw, videoHeight: vh } = layout;
  if (cw <= 0 || ch <= 0 || vw <= 0 || vh <= 0) {
    return { left: 0, top: 0, width: Math.max(0, cw), height: Math.max(0, ch) };
  }
  const videoAspect = vw / vh;
  const containerAspect = cw / ch;
  if (videoAspect > containerAspect) {
    const width = cw;
    const height = cw / videoAspect;
    return { left: 0, top: (ch - height) / 2, width, height };
  }
  const height = ch;
  const width = ch * videoAspect;
  return { left: (cw - width) / 2, top: 0, width, height };
}

/** 표시 영역 안에 들어가는 최대 프레임 (zoom=1 기준). frameAspect = width/height */
export function maxFrameInRect(w: number, h: number, frameAspect: number): Size {
  if (w <= 0 || h <= 0 || frameAspect <= 0) return { width: 0, height: 0 };
  let frameW = w;
  let frameH = w / frameAspect;
  if (frameH > h) {
    frameH = h;
    frameW = h * frameAspect;
  }
  return { width: frameW, height: frameH };
}

/** 표시 영역 안에 들어가는 최대 9:16 프레임 (zoom=1 기준) */
export function maxPortraitFrameInRect(w: number, h: number): Size {
  return maxFrameInRect(w, h, PORTRAIT_FRAME_ASPECT);
}

export function cropToFrameRect(
  crop: PromoFrameCropPure,
  display: Rect,
  frameAspect: number = PORTRAIT_FRAME_ASPECT
): Rect {
  const normalized = normalizePromoFrameCropPure(crop);
  const base = maxFrameInRect(display.width, display.height, frameAspect);
  const frameW = base.width / normalized.zoom;
  const frameH = base.height / normalized.zoom;
  const centerX = display.left + (normalized.focalX / 100) * display.width;
  const centerY = display.top + (normalized.focalY / 100) * display.height;
  const left = clamp(centerX - frameW / 2, display.left, display.left + display.width - frameW);
  const top = clamp(centerY - frameH / 2, display.top, display.top + display.height - frameH);
  return { left, top, width: frameW, height: frameH };
}

export function frameCenterToCrop(
  centerX: number,
  centerY: number,
  display: Rect,
  zoom: number
): PromoFrameCropPure {
  const focalX = ((centerX - display.left) / display.width) * 100;
  const focalY = ((centerY - display.top) / display.height) * 100;
  return normalizePromoFrameCropPure({ focalX, focalY, zoom });
}

export function clampFrameToDisplay(
  frame: Rect,
  display: Rect,
  zoom: number,
  frameAspect: number = PORTRAIT_FRAME_ASPECT
): Rect {
  const base = maxFrameInRect(display.width, display.height, frameAspect);
  const frameW = base.width / zoom;
  const frameH = base.height / zoom;
  const centerX = clamp(
    frame.left + frame.width / 2,
    display.left + frameW / 2,
    display.left + display.width - frameW / 2
  );
  const centerY = clamp(
    frame.top + frame.height / 2,
    display.top + frameH / 2,
    display.top + display.height - frameH / 2
  );
  return {
    left: centerX - frameW / 2,
    top: centerY - frameH / 2,
    width: frameW,
    height: frameH,
  };
}

export function frameRectToCrop(
  frame: Rect,
  display: Rect,
  zoom: number,
  frameAspect: number = PORTRAIT_FRAME_ASPECT
): PromoFrameCropPure {
  const clamped = clampFrameToDisplay(frame, display, zoom, frameAspect);
  return frameCenterToCrop(
    clamped.left + clamped.width / 2,
    clamped.top + clamped.height / 2,
    display,
    zoom
  );
}

export function adjustZoom(current: number, delta: number): number {
  const next = current + delta;
  return Math.min(PROMO_CROP_MAX_ZOOM, Math.max(PROMO_CROP_MIN_ZOOM, next));
}
