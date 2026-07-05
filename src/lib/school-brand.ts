import { rgba } from "@/lib/campusBrandColors";
import { CAMPUS_BACKGROUND_IDS, type CampusBackgroundId } from "@/lib/heroBackgroundPresets";

/** 학교 ID 해시로 고정 배경 선택 — gradientForTitle과 동일한 해시 패턴 */
export function schoolHeroBackground(schoolId: string): CampusBackgroundId {
  let hash = 0;
  for (let i = 0; i < schoolId.length; i++) hash = (hash + schoolId.charCodeAt(i) * 31) | 0;
  return CAMPUS_BACKGROUND_IDS[Math.abs(hash) % CAMPUS_BACKGROUND_IDS.length]!;
}

/** 로고 없는 학교 카드의 그라데이션 배경 */
export function schoolPosterGradient(colorPrimary: string, colorSecondary: string): string {
  return `linear-gradient(135deg, ${rgba(colorPrimary, 0.9)} 0%, ${rgba(colorSecondary, 0.85)} 100%)`;
}

/** 학교 프로필 히어로 배경 위에 얹는 브랜드 컬러 워시 */
export function schoolBrandWashGradient(colorPrimary: string, colorSecondary: string): string {
  return `linear-gradient(135deg, ${rgba(colorPrimary, 0.22)} 0%, ${rgba(colorSecondary, 0.12)} 55%, transparent 100%)`;
}
