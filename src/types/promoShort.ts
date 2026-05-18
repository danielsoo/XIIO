/** 홈·홍보용 숏폼 (업로더가 지정한 비율 그대로 게시) */
export type PromoShort = {
  id: string;
  /** 재생 URL (Cloudflare Stream HLS/MP4 등) */
  videoUrl: string;
  /** width / height — 예: 16/9, 9/16, 1/1 */
  aspectRatio: number;
  title: string;
  director: string;
  description: string;
  /** 초기 좋아요 수 (데모) */
  likeCount?: number;
};
