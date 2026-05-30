import type { WorkSection } from "@/types/work";

/** 쇼츠·홈 카탈로그 썸네일 공통 모서리 (14px) */
export const VIDEO_THUMB_ROUNDED_CLASS = "rounded-[14px]";

const GRADIENTS = [
  "bg-gradient-to-br from-blue-900 to-purple-900",
  "bg-gradient-to-br from-gray-800 to-gray-900",
  "bg-gradient-to-br from-pink-900 to-rose-900",
  "bg-gradient-to-br from-orange-900 to-red-900",
  "bg-gradient-to-br from-cyan-900 to-blue-900",
  "bg-gradient-to-br from-purple-900 to-violet-900",
];

export function gradientForTitle(title: string): string {
  let hash = 0;
  for (let i = 0; i < title.length; i++) hash = (hash + title.charCodeAt(i) * 31) | 0;
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length]!;
}

export function sectionCatalogHref(section: WorkSection): string {
  const paths: Record<WorkSection, string> = {
    movies: "/movies",
    series: "/series",
    entertainment: "/entertainment",
    shorts: "/shorts",
    "school-battle": "/school-battle",
  };
  return paths[section];
}

export function watchHref(ownerUid: string, workId: string): string {
  return `/watch/${ownerUid}/${workId}`;
}
