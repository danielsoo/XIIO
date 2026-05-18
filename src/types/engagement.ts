export type EngagementTarget = "promo" | "full";

export type LikeBody = {
  ownerUid: string;
  workId: string;
  liked: boolean;
};

export type ViewBody = {
  ownerUid: string;
  workId: string;
  target: EngagementTarget;
  sessionId?: string;
};

export type AnalyticsSummary = {
  totalLikes: number;
  totalViews: number;
  likesByDay: Record<string, number>;
  viewsByDay: Record<string, number>;
};

export type WorkAnalyticsBreakdown = {
  workId: string;
  title: string;
  fullViews: number;
  promoViews: number;
  promoLikes: number;
};

export type UploaderAnalyticsPayload = {
  summary: AnalyticsSummary;
  breakdown: WorkAnalyticsBreakdown[];
};
