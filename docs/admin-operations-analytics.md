# Admin operations analytics

The `/admin` overview uses real XIIO telemetry and provider data. It does not insert mock operational values.

## What is collected

- Browser-session visits and acquisition source (`discover`, `direct`, `search`, `schools`, or `external`).
- Work view events.
- Playback heartbeats, active sessions, watch time, completion, and delivered resolution.
- Upload and review state from Firestore work, promo, and prologue documents.
- Cloudflare Stream delivered minutes, when the analytics token is configured.

Telemetry is written by server routes to `platformAnalyticsDaily`, `platformContentAnalytics`, `platformWatchSessions`, and `platformVisitDedup`. No client can write directly to these collections.

`firestore.indexes.json` enables TTL cleanup for visit-deduplication and playback-session documents. Deploy the Firestore configuration after release so those temporary collections do not grow indefinitely.

## Environment variables

```dotenv
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_ANALYTICS_API_TOKEN=
XIIO_SOURCE_STORAGE_COST_PER_GB_MONTH=
XIIO_MONTHLY_VIDEO_BUDGET_USD=
```

`CLOUDFLARE_ANALYTICS_API_TOKEN` should be a read-only Cloudflare token with **Account Analytics: Read**. If it is absent, the server falls back to `CLOUDFLARE_STREAM_API_TOKEN`. Delivery cost remains unavailable when neither token can query Stream analytics.

The source-storage rate and monthly budget are optional. Without a source-storage rate, source-storage cost is shown as unavailable rather than estimated with an invented price.

## Cost formulas

- Stream storage: stored minutes × `$5 / 1,000 minutes`.
- Stream delivery: delivered minutes × `$1 / 1,000 minutes`.
- Source storage: source GB × configured monthly rate.

These are estimates for operational monitoring, not invoices. Taxes, provider discounts, egress outside Stream, and non-video infrastructure are not included.

## Dashboard behavior

- Supports 24-hour, 7-day, and 30-day periods with prior-period comparison.
- Auto-refreshes every 15 seconds; provider responses are cached for one minute.
- CSV export is generated locally in the browser.
- Missing provider configuration is shown explicitly as unavailable.
- Existing Firestore view totals remain visible while new watch telemetry accumulates.
