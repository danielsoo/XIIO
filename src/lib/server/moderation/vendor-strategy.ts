/**
 * XIIO 콘텐츠 검열 벤더 티어 — docs/content-moderation.md 와 동기화 유지.
 *
 * launch (비용 우선): Google Video Intelligence explicit + Gemini
 * value (성장기 가성비): Hive + Gemini — 월 ~120건(12분/건)부터 Google보다 저렴한 경우 많음
 * premium: Sightengine + Gemini — UGC 연동·튜닝 편의
 * maxCoverage: premium + ACRCloud (Phase 2)
 */
export const MODERATION_VENDOR_TIERS = {
  launch: {
    id: "launch",
    label: "비용 우선 (런칭)",
    videoProvider: "google" as const,
    policyProvider: "gemini" as const,
    when: "월 업로드 ~100건 이하, GCP(Firebase SA) 사용 가능",
    estUsdPer100Uploads: 20,
  },
  value: {
    id: "value",
    label: "가성비 (성장기)",
    videoProvider: "hive" as const,
    policyProvider: "gemini" as const,
    when: "월 ~120건 이상 또는 Google Video Intelligence 월 과금이 Hive 추정보다 클 때",
    estUsdPer100Uploads: 36,
    switchFrom: "google",
  },
  premium: {
    id: "premium",
    label: "운영·UGC 편의",
    videoProvider: "sightengine" as const,
    policyProvider: "gemini" as const,
    when: "예산 여유, Stream URL 직통·UGC 모델 튜닝 우선",
    estUsdPer100Uploads: 153,
    switchFrom: "google|hive",
  },
  maxCoverage: {
    id: "maxCoverage",
    label: "최고 커버리지",
    videoProvider: "sightengine" as const,
    policyProvider: "gemini" as const,
    audioCopyright: "acrcloud" as const,
    when: "음원 저작권 자동 플래그 필요 (Phase 2)",
  },
} as const;

/** 기본 영상 검열 — 비용 우선 */
export const DEFAULT_VIDEO_MODERATION_PROVIDER = MODERATION_VENDOR_TIERS.launch.videoProvider;
