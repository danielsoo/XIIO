import {
  FieldPath,
  FieldValue,
  Timestamp,
  type Firestore,
} from "firebase-admin/firestore";
import { getStreamThumbnailUrl, isStreamConfigured } from "@/lib/cloudflare/stream";
import {
  getCloudflareStreamAnalytics,
  isCloudflareAnalyticsConfigured,
} from "@/lib/server/cloudflare-stream-analytics";
import { parsePrologueDoc, parsePromoDoc, parseWorkDoc } from "@/lib/server/works";
import type {
  AdminAnalyticsRange,
  AdminOperationsAnalytics,
  AnalyticsTrendPoint,
} from "@/types/admin-analytics";
import type { WorkSection } from "@/types/work";

export type TrafficSource = "discover" | "direct" | "search" | "schools" | "external";

const LIVE_WINDOW_MS = 45_000;
const STREAM_STORAGE_USD_PER_MINUTE = 5 / 1000;
const STREAM_DELIVERY_USD_PER_MINUTE = 1 / 1000;
const RESOLUTION_LABELS = ["720p", "1080p", "1440p", "4K", "Other"] as const;

function dayKeyUTC(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

function hourKeyUTC(date = new Date()): string {
  return String(date.getUTCHours()).padStart(2, "0");
}

function dailyRef(db: Firestore, date = new Date()) {
  return db.collection("platformAnalyticsDaily").doc(dayKeyUTC(date));
}

function safeId(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 220);
}

function toMillis(value: unknown): number {
  if (value && typeof value === "object" && "toMillis" in value) {
    return (value as Timestamp).toMillis();
  }
  if (value instanceof Date) return value.getTime();
  if (typeof value === "string") return Date.parse(value) || 0;
  return 0;
}

function numberValue(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function nestedNumber(data: Record<string, unknown>, field: string, hour: string, key?: string): number {
  const byHour = data[field];
  if (!byHour || typeof byHour !== "object") return 0;
  const value = (byHour as Record<string, unknown>)[hour];
  if (!key) return numberValue(value);
  if (!value || typeof value !== "object") return 0;
  return numberValue((value as Record<string, unknown>)[key]);
}

function resolutionLabel(height?: number | null): (typeof RESOLUTION_LABELS)[number] {
  if (!height || !Number.isFinite(height)) return "Other";
  if (height >= 1800) return "4K";
  if (height >= 1200) return "1440p";
  if (height >= 900) return "1080p";
  if (height >= 600) return "720p";
  return "Other";
}

function rangeMs(range: AdminAnalyticsRange): number {
  if (range === "24h") return 24 * 60 * 60 * 1000;
  if (range === "7d") return 7 * 24 * 60 * 60 * 1000;
  return 30 * 24 * 60 * 60 * 1000;
}

function percentChange(value: number, previousValue: number): number | null {
  if (previousValue <= 0) return value > 0 ? 100 : null;
  return ((value - previousValue) / previousValue) * 100;
}

function parsePositiveEnv(name: string): number | null {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

export async function recordPlatformVisit(
  db: Firestore,
  params: { sessionId: string; source: TrafficSource; uid?: string | null }
): Promise<boolean> {
  const now = new Date();
  const day = dayKeyUTC(now);
  const hour = hourKeyUTC(now);
  const dedup = db.collection("platformVisitDedup").doc(safeId(`${day}_${params.sessionId}`));
  const daily = dailyRef(db, now);

  return db.runTransaction(async (tx) => {
    const seen = await tx.get(dedup);
    if (seen.exists) return false;
    tx.set(dedup, {
      sessionId: params.sessionId,
      uid: params.uid ?? null,
      source: params.source,
      day,
      createdAt: FieldValue.serverTimestamp(),
      expiresAt: Timestamp.fromMillis(now.getTime() + 32 * 24 * 60 * 60 * 1000),
    });
    tx.set(
      daily,
      {
        visits: FieldValue.increment(1),
        [`visitsByHour.${hour}`]: FieldValue.increment(1),
        [`trafficByHour.${hour}.${params.source}`]: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    return true;
  });
}

export async function recordPlatformView(
  db: Firestore,
  params: {
    ownerUid: string;
    workId: string;
    title: string;
    section: WorkSection;
    streamUid?: string;
  }
): Promise<void> {
  const now = new Date();
  const hour = hourKeyUTC(now);
  const contentRef = db
    .collection("platformContentAnalytics")
    .doc(safeId(`${params.ownerUid}_${params.workId}`));
  await Promise.all([
    dailyRef(db, now).set(
      {
        views: FieldValue.increment(1),
        [`viewsByHour.${hour}`]: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    ),
    contentRef.set(
      {
        ...params,
        views: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    ),
  ]);
}

export async function recordWatchHeartbeat(
  db: Firestore,
  params: {
    viewerKey: string;
    ownerUid: string;
    workId: string;
    title: string;
    section: WorkSection;
    streamUid?: string;
    positionSec: number;
    durationSec: number;
    resolutionHeight?: number | null;
    isPlaying: boolean;
  }
): Promise<void> {
  const now = new Date();
  const hour = hourKeyUTC(now);
  const bucket = resolutionLabel(params.resolutionHeight);
  const sessionRef = db
    .collection("platformWatchSessions")
    .doc(safeId(`${params.viewerKey}_${params.ownerUid}_${params.workId}`));
  const contentRef = db
    .collection("platformContentAnalytics")
    .doc(safeId(`${params.ownerUid}_${params.workId}`));

  await db.runTransaction(async (tx) => {
    const previous = await tx.get(sessionRef);
    const previousData = previous.data() ?? {};
    const previousPosition = numberValue(previousData.positionSec);
    const previousSeenMs = toMillis(previousData.lastSeenAt);
    const elapsedMs = previousSeenMs > 0 ? now.getTime() - previousSeenMs : Number.POSITIVE_INFINITY;
    const rawDelta = params.positionSec - previousPosition;
    const watchedDelta =
      params.isPlaying && elapsedMs <= 120_000 && rawDelta > 0
        ? Math.min(rawDelta, 30)
        : 0;
    const completionNow =
      params.durationSec > 0 && params.positionSec / params.durationSec >= 0.95;
    const completionDelta = completionNow && previousData.completed !== true ? 1 : 0;

    tx.set(
      sessionRef,
      {
        viewerKey: params.viewerKey,
        ownerUid: params.ownerUid,
        workId: params.workId,
        title: params.title,
        section: params.section,
        streamUid: params.streamUid ?? null,
        positionSec: Math.max(0, params.positionSec),
        durationSec: Math.max(0, params.durationSec),
        resolution: bucket,
        isPlaying: params.isPlaying,
        completed: previousData.completed === true || completionNow,
        lastSeenAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        expiresAt: Timestamp.fromMillis(now.getTime() + 90 * 24 * 60 * 60 * 1000),
      },
      { merge: true }
    );

    if (watchedDelta <= 0 && completionDelta <= 0) return;

    tx.set(
      dailyRef(db, now),
      {
        watchSeconds: FieldValue.increment(watchedDelta),
        completions: FieldValue.increment(completionDelta),
        [`watchSecondsByHour.${hour}`]: FieldValue.increment(watchedDelta),
        [`resolutionSecondsByHour.${hour}.${bucket}`]: FieldValue.increment(watchedDelta),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    tx.set(
      contentRef,
      {
        ownerUid: params.ownerUid,
        workId: params.workId,
        title: params.title,
        section: params.section,
        streamUid: params.streamUid ?? null,
        watchSeconds: FieldValue.increment(watchedDelta),
        completions: FieldValue.increment(completionDelta),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  });
}

type WorkRow = {
  ownerUid: string;
  workId: string;
  title: string;
  section: WorkSection;
  status: string;
  streamStatus: string;
  streamUid?: string;
  createdAtMs: number;
  updatedAtMs: number;
  views: number;
  thumbnailUrl: string | null;
  sourceBytes: number;
  durationSec: number;
  provider: "firebase" | "unknown";
  revisionPending: boolean;
};

function workOwnerUid(path: string): string {
  const parts = path.split("/");
  const userIndex = parts.indexOf("users");
  return userIndex >= 0 ? parts[userIndex + 1] ?? "" : "";
}

function buildTrend(
  range: AdminAnalyticsRange,
  now: Date,
  daily: Map<string, Record<string, unknown>>,
  liveByHour: Map<string, number>
): AnalyticsTrendPoint[] {
  const points: AnalyticsTrendPoint[] = [];
  const hours = range === "24h" ? 24 : range === "7d" ? 7 * 24 : 30 * 24;
  const groupHours = range === "24h" ? 1 : 24;
  const startMs = now.getTime() - rangeMs(range);

  for (let offset = 0; offset < hours; offset += groupHours) {
    const bucketStart = new Date(startMs + offset * 60 * 60 * 1000);
    let viewers = 0;
    let watchSeconds = 0;
    let visits = 0;
    for (let inner = 0; inner < groupHours; inner++) {
      const at = new Date(bucketStart.getTime() + inner * 60 * 60 * 1000);
      const day = dayKeyUTC(at);
      const hour = hourKeyUTC(at);
      const data = daily.get(day) ?? {};
      const bucketKey = `${day}T${hour}`;
      viewers += liveByHour.get(bucketKey) ?? nestedNumber(data, "viewsByHour", hour);
      watchSeconds += nestedNumber(data, "watchSecondsByHour", hour);
      visits += nestedNumber(data, "visitsByHour", hour);
    }
    const label =
      range === "24h"
        ? bucketStart.toLocaleTimeString("en-US", { hour: "numeric", timeZone: "UTC" })
        : bucketStart.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            timeZone: "UTC",
          });
    points.push({
      key: bucketStart.toISOString(),
      label,
      viewers,
      watchMinutes: watchSeconds / 60,
      visits,
    });
  }
  return points;
}

function sumPeriod(
  daily: Map<string, Record<string, unknown>>,
  startMs: number,
  endMs: number
) {
  let watchSeconds = 0;
  let visits = 0;
  let views = 0;
  const traffic: Record<TrafficSource, number> = {
    discover: 0,
    direct: 0,
    search: 0,
    schools: 0,
    external: 0,
  };
  const resolution = Object.fromEntries(RESOLUTION_LABELS.map((key) => [key, 0])) as Record<
    (typeof RESOLUTION_LABELS)[number],
    number
  >;

  for (let cursor = Math.floor(startMs / 3_600_000) * 3_600_000; cursor < endMs; cursor += 3_600_000) {
    if (cursor < startMs) continue;
    const at = new Date(cursor);
    const data = daily.get(dayKeyUTC(at)) ?? {};
    const hour = hourKeyUTC(at);
    watchSeconds += nestedNumber(data, "watchSecondsByHour", hour);
    visits += nestedNumber(data, "visitsByHour", hour);
    views += nestedNumber(data, "viewsByHour", hour);
    for (const key of Object.keys(traffic) as TrafficSource[]) {
      traffic[key] += nestedNumber(data, "trafficByHour", hour, key);
    }
    for (const key of RESOLUTION_LABELS) {
      resolution[key] += nestedNumber(data, "resolutionSecondsByHour", hour, key);
    }
  }
  return { watchSeconds, visits, views, traffic, resolution };
}

export async function getAdminOperationsAnalytics(
  db: Firestore,
  range: AdminAnalyticsRange
): Promise<AdminOperationsAnalytics> {
  const now = new Date();
  const periodMs = rangeMs(range);
  const currentStartMs = now.getTime() - periodMs;
  const previousStartMs = currentStartMs - periodMs;
  const cutoffDate = new Date(previousStartMs - 24 * 60 * 60 * 1000);
  const liveCutoff = Timestamp.fromMillis(now.getTime() - LIVE_WINDOW_MS);

  const [dailySnap, worksSnap, promosSnap, prologuesSnap, liveSnap, contentAnalyticsSnap] =
    await Promise.all([
      db
        .collection("platformAnalyticsDaily")
        .where(FieldPath.documentId(), ">=", dayKeyUTC(cutoffDate))
        .get(),
      db.collectionGroup("works").get(),
      db.collectionGroup("promoShort").get(),
      db.collectionGroup("prologueShort").get(),
      db.collection("platformWatchSessions").where("lastSeenAt", ">=", liveCutoff).get(),
      db.collection("platformContentAnalytics").get(),
    ]);

  const daily = new Map<string, Record<string, unknown>>();
  for (const doc of dailySnap.docs) daily.set(doc.id, doc.data());

  const current = sumPeriod(daily, currentStartMs, now.getTime());
  const previous = sumPeriod(daily, previousStartMs, currentStartMs);

  const works: WorkRow[] = worksSnap.docs.map((doc) => {
    const data = doc.data() as Record<string, unknown>;
    const parsed = parseWorkDoc(doc.id, data);
    const master = parsed.videoMaster;
    const staging = parsed.videoStaging;
    const sourceBytes = master?.bytes ?? staging?.fullBytes ?? 0;
    return {
      ownerUid: workOwnerUid(doc.ref.path),
      workId: doc.id,
      title: parsed.title,
      section: parsed.section,
      status: parsed.platformStatus,
      streamStatus: parsed.streamStatus,
      streamUid: parsed.streamUid,
      createdAtMs: toMillis(parsed.createdAt),
      updatedAtMs: toMillis(parsed.updatedAt),
      views: parsed.viewCount ?? 0,
      thumbnailUrl:
        parsed.promoDraft?.thumbnailUrl ??
        (parsed.streamUid ? getStreamThumbnailUrl(parsed.streamUid, { width: 320, height: 180, fit: "crop" }) : null),
      sourceBytes,
      durationSec: master?.durationSec ?? 0,
      provider: master?.storageProvider === "firebase" ? "firebase" : "unknown",
      revisionPending: parsed.revisionReviewStatus === "pending",
    };
  });

  let promoDurationSec = 0;
  let stagedPromoBytes = 0;
  for (const doc of promosSnap.docs) {
    const promo = parsePromoDoc(doc.data() as Record<string, unknown>);
    if (promo.streamUid && promo.platformStatus !== "rejected") {
      promoDurationSec += promo.durationSec ?? 0;
    }
  }
  let prologueDurationSec = 0;
  for (const doc of prologuesSnap.docs) {
    const prologue = parsePrologueDoc(doc.data() as Record<string, unknown>);
    if (prologue.streamUid && prologue.platformStatus !== "rejected") {
      prologueDurationSec += prologue.durationSec ?? 0;
    }
  }
  for (const row of worksSnap.docs) {
    const parsed = parseWorkDoc(row.id, row.data() as Record<string, unknown>);
    stagedPromoBytes += (parsed.videoStaging?.promoBytes ?? 0) + (parsed.videoStaging?.prologueBytes ?? 0);
  }

  const currentUploads = works.filter(
    (work) => work.createdAtMs >= currentStartMs && work.createdAtMs < now.getTime()
  ).length;
  const previousUploads = works.filter(
    (work) => work.createdAtMs >= previousStartMs && work.createdAtMs < currentStartMs
  ).length;

  const liveSessions = liveSnap.docs
    .map((doc) => doc.data() as Record<string, unknown>)
    .filter((data) => data.isPlaying === true);
  const liveByWork = new Map<string, number>();
  for (const data of liveSessions) {
    const key = `${String(data.ownerUid ?? "")}_${String(data.workId ?? "")}`;
    liveByWork.set(key, (liveByWork.get(key) ?? 0) + 1);
  }

  const contentAnalytics = new Map<string, Record<string, unknown>>();
  for (const doc of contentAnalyticsSnap.docs) {
    const data = doc.data() as Record<string, unknown>;
    contentAnalytics.set(`${String(data.ownerUid ?? "")}_${String(data.workId ?? "")}`, data);
  }

  const cloudflareCurrentPromise = getCloudflareStreamAnalytics(new Date(currentStartMs), now);
  const cloudflarePreviousPromise = getCloudflareStreamAnalytics(
    new Date(previousStartMs),
    new Date(currentStartMs)
  );
  const [cloudflareCurrent, cloudflarePrevious] = await Promise.all([
    cloudflareCurrentPromise,
    cloudflarePreviousPromise,
  ]);

  const currentDeliveryMinutes = cloudflareCurrent?.minutesViewed ?? current.watchSeconds / 60;
  const previousDeliveryMinutes = cloudflarePrevious?.minutesViewed ?? previous.watchSeconds / 60;
  const deliverySource = cloudflareCurrent
    ? "cloudflare"
    : current.watchSeconds > 0
      ? "playback_telemetry"
      : "unavailable";

  const currentDeliveryCost = currentDeliveryMinutes * STREAM_DELIVERY_USD_PER_MINUTE;
  const previousDeliveryCost = previousDeliveryMinutes * STREAM_DELIVERY_USD_PER_MINUTE;
  const streamStorageMinutes =
    (works.reduce((sum, work) => sum + (work.streamUid ? work.durationSec : 0), 0) +
      promoDurationSec +
      prologueDurationSec) /
    60;
  const streamStorageCost = streamStorageMinutes * STREAM_STORAGE_USD_PER_MINUTE;
  const sourceStorageBytes = works.reduce((sum, work) => sum + work.sourceBytes, 0) + stagedPromoBytes;
  const sourceRatePerGbMonth = parsePositiveEnv("XIIO_SOURCE_STORAGE_COST_PER_GB_MONTH");
  const sourceStorageCost =
    sourceRatePerGbMonth == null
      ? null
      : (sourceStorageBytes / 1024 / 1024 / 1024) * sourceRatePerGbMonth;
  const periodDays = range === "24h" ? 1 : range === "7d" ? 7 : 30;
  const monthlyDeliveryForecast = (currentDeliveryCost / periodDays) * 30;
  const monthlyForecast =
    streamStorageCost + monthlyDeliveryForecast + (sourceStorageCost ?? 0);
  const budget = parsePositiveEnv("XIIO_MONTHLY_VIDEO_BUDGET_USD");

  const trafficLabels: Record<TrafficSource, string> = {
    discover: "Discover",
    direct: "Direct",
    search: "Search",
    schools: "Schools",
    external: "External",
  };
  const trafficTotal = Object.values(current.traffic).reduce((sum, value) => sum + value, 0);
  const trafficSources = (Object.keys(current.traffic) as TrafficSource[])
    .map((key) => ({
      key,
      label: trafficLabels[key],
      count: current.traffic[key],
      percent: trafficTotal > 0 ? (current.traffic[key] / trafficTotal) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count);

  const resolutionTotal = Object.values(current.resolution).reduce((sum, value) => sum + value, 0);
  const resolutionMix = RESOLUTION_LABELS.map((label) => ({
    label,
    seconds: current.resolution[label],
    percent: resolutionTotal > 0 ? (current.resolution[label] / resolutionTotal) * 100 : 0,
  }));

  const topContent = works
    .filter((work) => work.status === "published")
    .map((work) => {
      const key = `${work.ownerUid}_${work.workId}`;
      const analytics = contentAnalytics.get(key) ?? {};
      const analyticsViews = numberValue(analytics.views);
      const completions = numberValue(analytics.completions);
      const streamMinutes = work.streamUid ? cloudflareCurrent?.byUid[work.streamUid] ?? null : null;
      return {
        ownerUid: work.ownerUid,
        workId: work.workId,
        title: work.title,
        thumbnailUrl: work.thumbnailUrl,
        liveViewers: liveByWork.get(key) ?? 0,
        views: Math.max(work.views, analyticsViews),
        watchMinutes: numberValue(analytics.watchSeconds) / 60,
        completionPercent: analyticsViews > 0 ? Math.min(100, (completions / analyticsViews) * 100) : null,
        deliveryMinutes: streamMinutes,
        status: (liveByWork.get(key) ?? 0) > 0 ? ("live" as const) : ("published" as const),
      };
    })
    .sort((a, b) => b.liveViewers - a.liveViewers || b.watchMinutes - a.watchMinutes || b.views - a.views)
    .slice(0, 6);

  const delayedProcessing = works.filter(
    (work) =>
      (work.streamStatus === "processing" || work.streamStatus === "uploading") &&
      work.updatedAtMs > 0 &&
      now.getTime() - work.updatedAtMs > 30 * 60 * 1000
  ).length;

  const providers = new Set(works.map((work) => work.provider).filter((provider) => provider !== "unknown"));
  const sourceStorageProvider = providers.size === 1 && providers.has("firebase") ? "firebase" : providers.size > 1 ? "mixed" : "unknown";

  return {
    generatedAt: now.toISOString(),
    range,
    kpis: {
      liveViewers: liveSessions.length,
      watchMinutes: {
        value: current.watchSeconds / 60,
        previousValue: previous.watchSeconds / 60,
        changePercent: percentChange(current.watchSeconds, previous.watchSeconds),
      },
      visits: {
        value: current.visits,
        previousValue: previous.visits,
        changePercent: percentChange(current.visits, previous.visits),
      },
      uploads: {
        value: currentUploads,
        previousValue: previousUploads,
        changePercent: percentChange(currentUploads, previousUploads),
      },
      deliveryCostUsd: {
        value: currentDeliveryCost,
        previousValue: previousDeliveryCost,
        changePercent: percentChange(currentDeliveryCost, previousDeliveryCost),
        source: deliverySource,
      },
    },
    streaming: buildTrend(range, now, daily, new Map()),
    resolutionMix,
    uploadPipeline: {
      new: works.filter((work) => work.status === "draft").length,
      processing: works.filter((work) => work.streamStatus === "processing" || work.streamStatus === "uploading").length,
      inReview: works.filter((work) => work.status === "pending" || work.revisionPending).length,
      ready: works.filter((work) => work.status === "published" && work.streamStatus === "ready").length,
      failed: works.filter((work) => work.streamStatus === "error").length,
    },
    trafficSources,
    costs: {
      sourceStorageBytes,
      sourceStorageCostUsd: sourceStorageCost,
      sourceStorageProvider,
      streamStorageMinutes,
      streamStorageCostUsd: streamStorageCost,
      streamDeliveryMinutes: deliverySource === "unavailable" ? null : currentDeliveryMinutes,
      streamDeliveryCostUsd: deliverySource === "unavailable" ? null : currentDeliveryCost,
      monthlyForecastUsd: Number.isFinite(monthlyForecast) ? monthlyForecast : null,
      forecastWithinBudget: budget == null ? null : monthlyForecast <= budget,
      monthlyBudgetUsd: budget,
    },
    topContent,
    systemHealth: [
      {
        key: "stream",
        label: "Cloudflare Stream",
        status: !isStreamConfigured()
          ? "unavailable"
          : isCloudflareAnalyticsConfigured() && cloudflareCurrent
            ? "operational"
            : "warning",
        detail: !isStreamConfigured()
          ? "Playback configuration not found"
          : !isCloudflareAnalyticsConfigured()
            ? "Playback ready; analytics token not configured"
            : cloudflareCurrent
              ? "Delivery analytics connected"
              : "Analytics query unavailable or missing permission",
      },
      {
        key: "source_storage",
        label: "Source storage",
        status: sourceStorageProvider === "unknown" ? "warning" : "operational",
        detail: sourceStorageProvider === "firebase" ? "Firebase Storage" : "Provider metadata incomplete",
      },
      { key: "firestore", label: "Firestore", status: "operational", detail: "Metrics connected" },
      {
        key: "webhooks",
        label: "Processing webhooks",
        status: delayedProcessing > 0 ? "warning" : "operational",
        detail: delayedProcessing > 0 ? `${delayedProcessing} delayed` : "No delayed jobs",
      },
    ],
  };
}
