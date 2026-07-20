type StreamAnalyticsResult = {
  minutesViewed: number;
  byUid: Record<string, number>;
};

type CacheEntry = {
  expiresAt: number;
  value: StreamAnalyticsResult | null;
};

const analyticsCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60_000;

function accountId(): string | null {
  return process.env.CLOUDFLARE_ACCOUNT_ID?.trim() || null;
}

function analyticsToken(): string | null {
  return (
    process.env.CLOUDFLARE_ANALYTICS_API_TOKEN?.trim() ||
    process.env.CLOUDFLARE_STREAM_API_TOKEN?.trim() ||
    null
  );
}

export function isCloudflareAnalyticsConfigured(): boolean {
  return Boolean(accountId() && analyticsToken());
}

/**
 * Cloudflare Stream server-side delivery analytics. The query is intentionally
 * limited to 31 days, which is the maximum interval supported by Stream.
 */
export async function getCloudflareStreamAnalytics(
  start: Date,
  end: Date
): Promise<StreamAnalyticsResult | null> {
  const accountTag = accountId();
  const token = analyticsToken();
  if (!accountTag || !token) return null;

  const cacheKey = `${Math.floor(start.getTime() / 60_000)}:${Math.floor(end.getTime() / 60_000)}`;
  const cached = analyticsCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const query = `
    query StreamDelivery($accountTag: string!, $start: DateTime, $end: DateTime) {
      viewer {
        accounts(filter: { accountTag: $accountTag }) {
          streamMinutesViewedAdaptiveGroups(
            filter: { datetime_geq: $start, datetime_lt: $end }
            orderBy: [sum_minutesViewed_DESC]
            limit: 10000
          ) {
            sum { minutesViewed }
            dimensions { uid }
          }
        }
      }
    }
  `;

  try {
    const response = await fetch("https://api.cloudflare.com/client/v4/graphql", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        variables: {
          accountTag,
          start: start.toISOString(),
          end: end.toISOString(),
        },
      }),
      cache: "no-store",
    });

    const payload = (await response.json().catch(() => null)) as
      | {
          data?: {
            viewer?: {
              accounts?: Array<{
                streamMinutesViewedAdaptiveGroups?: Array<{
                  sum?: { minutesViewed?: number };
                  dimensions?: { uid?: string };
                }>;
              }>;
            };
          };
          errors?: unknown[];
        }
      | null;

    if (!response.ok || payload?.errors?.length) {
      analyticsCache.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL_MS, value: null });
      return null;
    }
    const rows = payload?.data?.viewer?.accounts?.[0]?.streamMinutesViewedAdaptiveGroups ?? [];
    const byUid: Record<string, number> = {};
    let minutesViewed = 0;
    for (const row of rows) {
      const minutes = Number(row.sum?.minutesViewed ?? 0);
      if (!Number.isFinite(minutes) || minutes <= 0) continue;
      minutesViewed += minutes;
      const uid = row.dimensions?.uid;
      if (uid) byUid[uid] = (byUid[uid] ?? 0) + minutes;
    }
    const result = { minutesViewed, byUid };
    analyticsCache.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL_MS, value: result });
    return result;
  } catch {
    analyticsCache.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL_MS, value: null });
    return null;
  }
}
