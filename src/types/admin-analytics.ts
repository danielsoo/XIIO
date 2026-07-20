export type AdminAnalyticsRange = "24h" | "7d" | "30d";

export type AnalyticsTrendPoint = {
  key: string;
  label: string;
  viewers: number;
  watchMinutes: number;
  visits: number;
};

export type AdminAnalyticsMetric = {
  value: number;
  previousValue: number;
  changePercent: number | null;
};

export type AdminOperationsAnalytics = {
  generatedAt: string;
  range: AdminAnalyticsRange;
  kpis: {
    liveViewers: number;
    watchMinutes: AdminAnalyticsMetric;
    visits: AdminAnalyticsMetric;
    uploads: AdminAnalyticsMetric;
    deliveryCostUsd: AdminAnalyticsMetric & {
      source: "cloudflare" | "playback_telemetry" | "unavailable";
    };
  };
  streaming: AnalyticsTrendPoint[];
  resolutionMix: Array<{
    label: "720p" | "1080p" | "1440p" | "4K" | "Other";
    seconds: number;
    percent: number;
  }>;
  uploadPipeline: {
    new: number;
    processing: number;
    inReview: number;
    ready: number;
    failed: number;
  };
  trafficSources: Array<{
    key: "discover" | "direct" | "search" | "schools" | "external";
    label: string;
    count: number;
    percent: number;
  }>;
  costs: {
    sourceStorageBytes: number;
    sourceStorageCostUsd: number | null;
    sourceStorageProvider: "firebase" | "mixed" | "unknown";
    streamStorageMinutes: number;
    streamStorageCostUsd: number;
    streamDeliveryMinutes: number | null;
    streamDeliveryCostUsd: number | null;
    monthlyForecastUsd: number | null;
    forecastWithinBudget: boolean | null;
    monthlyBudgetUsd: number | null;
  };
  topContent: Array<{
    ownerUid: string;
    workId: string;
    title: string;
    thumbnailUrl: string | null;
    liveViewers: number;
    views: number;
    watchMinutes: number;
    completionPercent: number | null;
    deliveryMinutes: number | null;
    status: "live" | "published";
  }>;
  systemHealth: Array<{
    key: "stream" | "source_storage" | "firestore" | "webhooks";
    label: string;
    status: "operational" | "warning" | "unavailable";
    detail: string;
  }>;
};

