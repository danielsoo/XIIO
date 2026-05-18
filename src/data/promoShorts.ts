import type { PromoShort } from "@/types/promoShort";

/** 홍보 숏폼 목록 — 추후 Firestore `videos` 등에서 교체 */
export const PROMO_SHORTS: PromoShort[] = [
  {
    id: "promo-1",
    videoUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    aspectRatio: 16 / 9,
    title: "청춘의 끝에서",
    director: "김서연",
    description: "졸업 전날 밤, 서로 다른 선택을 향해 달리는 두 친구의 이야기.",
    likeCount: 1284,
  },
  {
    id: "promo-2",
    videoUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    aspectRatio: 4 / 5,
    title: "캠퍼스 미니 다큐",
    director: "박준호",
    description: "하루 종일 캠퍼스를 걷으며 기록한 짧은 다큐멘터리.",
    likeCount: 892,
  },
  {
    id: "promo-3",
    videoUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
    aspectRatio: 16 / 9,
    title: "밤새 게임",
    director: "이민지",
    description: "기숙사에서 벌어지는 24시간 게임 챌린지 — 웃음과 긴장의 연속.",
    likeCount: 2103,
  },
];

/** @deprecated PROMO_SHORTS 사용 */
export const HOME_PROMO_SHORTS = PROMO_SHORTS;
