import type { PromoFrameCrop } from "@/types/work";

export const PROMO_CROP_MIN_ZOOM = 1;
export const PROMO_CROP_MAX_ZOOM = 2.5;

export function defaultPromoFrameCrop(): PromoFrameCrop {
  return { focalX: 50, focalY: 50, zoom: 1 };
}

export function normalizePromoFrameCrop(value: unknown): PromoFrameCrop {
  if (!value || typeof value !== "object") return defaultPromoFrameCrop();
  const row = value as Record<string, unknown>;
  const focalX = clampPercent(row.focalX);
  const focalY = clampPercent(row.focalY);
  const zoom = clampZoom(row.zoom);
  return { focalX, focalY, zoom };
}

function clampPercent(value: unknown): number {
  const n = typeof value === "number" ? value : 50;
  if (!Number.isFinite(n)) return 50;
  return Math.min(100, Math.max(0, n));
}

function clampZoom(value: unknown): number {
  const n = typeof value === "number" ? value : 1;
  if (!Number.isFinite(n)) return 1;
  return Math.min(PROMO_CROP_MAX_ZOOM, Math.max(PROMO_CROP_MIN_ZOOM, n));
}
