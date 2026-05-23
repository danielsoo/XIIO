/** @deprecated Use StreamTusUpload — basic POST blocked by browser CORS for direct uploads */
export type StreamDirectUpload = {
  uploadURL: string;
  uid: string;
};

export type StreamTusUpload = {
  tusEndpoint: string;
  uid: string;
};

const MAX_DURATION_SECONDS = 3600;
export const MAX_STREAM_UPLOAD_BYTES = 30 * 1024 * 1024 * 1024;

export type StreamVideoInfo = {
  uid: string;
  /** Cloudflare status.state — ready, inprogress, pendingupload, error, … */
  statusState?: string;
  duration?: number;
  width?: number;
  height?: number;
  playbackHls?: string;
  thumbnail?: string;
};

function getAccountId(): string | null {
  return process.env.CLOUDFLARE_ACCOUNT_ID ?? null;
}

function getApiToken(): string | null {
  return process.env.CLOUDFLARE_STREAM_API_TOKEN ?? null;
}

function getCustomerSubdomain(): string | null {
  return (
    process.env.CLOUDFLARE_STREAM_CUSTOMER_SUBDOMAIN?.trim() ||
    process.env.NEXT_PUBLIC_CLOUDFLARE_STREAM_CUSTOMER_SUBDOMAIN?.trim() ||
    null
  );
}

export function isStreamConfigured(): boolean {
  return !!(getAccountId() && getApiToken());
}

async function streamFetch(path: string, init?: RequestInit) {
  const accountId = getAccountId();
  const token = getApiToken();
  if (!accountId || !token) {
    throw new Error("Cloudflare Stream not configured");
  }
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/stream${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  return res;
}

/** Cloudflare TUS Upload-Metadata: `key base64value` pairs comma-separated */
export function encodeTusMetadata(entries: Record<string, string>): string {
  return Object.entries(entries)
    .map(([key, value]) => `${key} ${Buffer.from(value, "utf8").toString("base64")}`)
    .join(",");
}

function uidFromTusLocation(location: string): string | null {
  try {
    const path = new URL(location).pathname;
    const segments = path.split("/").filter(Boolean);
    return segments[segments.length - 1] ?? null;
  } catch {
    return null;
  }
}

export async function createTusDirectUpload(params: {
  uploadLength: number;
  meta: Record<string, string>;
}): Promise<StreamTusUpload> {
  const accountId = getAccountId();
  const token = getApiToken();
  if (!accountId || !token) {
    throw new Error("Cloudflare Stream not configured");
  }

  const uploadMetadata = encodeTusMetadata({
    maxDurationSeconds: String(MAX_DURATION_SECONDS),
    ...params.meta,
  });

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream?direct_user=true`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Tus-Resumable": "1.0.0",
        "Upload-Length": String(params.uploadLength),
        "Upload-Metadata": uploadMetadata,
      },
    }
  );

  const location = res.headers.get("Location");
  const json = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    errors?: { message: string }[];
    result?: { uid?: string };
  };

  if (!res.ok || !location) {
    const msg = json.errors?.[0]?.message ?? `Stream TUS API ${res.status}`;
    throw new Error(msg);
  }

  const uid = json.result?.uid ?? uidFromTusLocation(location);
  if (!uid) {
    throw new Error("Stream TUS API did not return a video uid");
  }

  return { tusEndpoint: location, uid };
}

/** @deprecated Use createTusDirectUpload */
export async function createDirectUpload(meta: Record<string, string>): Promise<StreamDirectUpload> {
  const res = await streamFetch("/direct_upload", {
    method: "POST",
    body: JSON.stringify({
      maxDurationSeconds: MAX_DURATION_SECONDS,
      requireSignedURLs: false,
      meta,
    }),
  });

  const json = (await res.json()) as {
    success?: boolean;
    errors?: { message: string }[];
    result?: { uploadURL: string; uid: string };
  };

  if (!res.ok || !json.success || !json.result?.uploadURL) {
    const msg = json.errors?.[0]?.message ?? `Stream API ${res.status}`;
    throw new Error(msg);
  }

  return {
    uploadURL: json.result.uploadURL,
    uid: json.result.uid,
  };
}

export async function createClip(params: {
  clippedFromVideoUID: string;
  startTimeSeconds: number;
  endTimeSeconds: number;
  meta: Record<string, string>;
}): Promise<{ uid: string }> {
  const res = await streamFetch("/clip", {
    method: "POST",
    body: JSON.stringify({
      clippedFromVideoUID: params.clippedFromVideoUID,
      startTimeSeconds: params.startTimeSeconds,
      endTimeSeconds: params.endTimeSeconds,
      meta: params.meta,
    }),
  });

  const json = (await res.json()) as {
    success?: boolean;
    errors?: { message: string }[];
    result?: { uid: string };
  };

  if (!res.ok || !json.success || !json.result?.uid) {
    const msg = json.errors?.[0]?.message ?? `Stream clip API ${res.status}`;
    throw new Error(msg);
  }

  return { uid: json.result.uid };
}

export async function deleteStreamVideo(streamUid: string): Promise<void> {
  const res = await streamFetch(`/${streamUid}`, { method: "DELETE" });
  const json = (await res.json()) as { success?: boolean; errors?: { message: string }[] };
  if (!res.ok || !json.success) {
    const msg = json.errors?.[0]?.message ?? `Stream delete ${res.status}`;
    throw new Error(msg);
  }
}

export async function getStreamVideo(streamUid: string): Promise<StreamVideoInfo | null> {
  const res = await streamFetch(`/${streamUid}`, { method: "GET" });
  const json = (await res.json()) as {
    success?: boolean;
    result?: {
      uid: string;
      duration?: number;
      status?: { state?: string };
      input?: { width?: number; height?: number };
      playback?: { hls?: string };
      thumbnail?: string;
    };
  };
  if (!res.ok || !json.success || !json.result) return null;
  const r = json.result;
  return {
    uid: r.uid,
    statusState: r.status?.state,
    duration: r.duration,
    width: r.input?.width,
    height: r.input?.height,
    playbackHls: r.playback?.hls,
    thumbnail: r.thumbnail,
  };
}

/** Public thumbnail for Stream UID (customer subdomain) */
export function getStreamThumbnailUrl(streamUid: string): string | null {
  const sub = getCustomerSubdomain();
  if (!sub) return null;
  return `https://${sub}/${streamUid}/thumbnails/thumbnail.jpg`;
}

/** 홈 히어로·promo 피드 — HLS manifest를 고화질 rendition 위주로 */
export const STREAM_TEASER_BANDWIDTH_HINT_MBPS = 50;

export type PlaybackUrlOptions = {
  clientBandwidthHintMbps?: number;
};

export function appendPlaybackBandwidthHint(url: string, hintMbps: number): string {
  try {
    const parsed = new URL(url);
    parsed.searchParams.set("clientBandwidthHint", String(hintMbps));
    return parsed.toString();
  } catch {
    const sep = url.includes("?") ? "&" : "?";
    return `${url}${sep}clientBandwidthHint=${hintMbps}`;
  }
}

export function getPlaybackUrl(
  streamUid: string,
  opts?: PlaybackUrlOptions
): string | null {
  const sub = getCustomerSubdomain();
  if (!sub) return null;
  const base = `https://${sub}/${streamUid}/manifest/video.m3u8`;
  const hint = opts?.clientBandwidthHintMbps;
  if (hint != null && hint > 0) {
    return appendPlaybackBandwidthHint(base, hint);
  }
  return base;
}

export async function resolvePlaybackUrl(streamUid: string): Promise<string | null> {
  const direct = getPlaybackUrl(streamUid);
  if (direct) return direct;
  const info = await getStreamVideo(streamUid);
  return info?.playbackHls ?? null;
}

/** Cloudflare Stream iframe player (works across browsers for HLS) */
export function getStreamEmbedUrl(streamUid: string): string {
  const sub = getCustomerSubdomain();
  if (sub) {
    return `https://${sub}/${streamUid}/iframe`;
  }
  return `https://iframe.cloudflarestream.com/${streamUid}`;
}

export function aspectRatioFromVideo(info: StreamVideoInfo | null, fallback = 16 / 9): number {
  if (info?.width && info?.height && info.height > 0) {
    return info.width / info.height;
  }
  return fallback;
}
