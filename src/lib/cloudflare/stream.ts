export type StreamDirectUpload = {
  uploadURL: string;
  uid: string;
};

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

export async function createDirectUpload(meta: Record<string, string>): Promise<StreamDirectUpload> {
  const res = await streamFetch("/direct_upload", {
    method: "POST",
    body: JSON.stringify({
      maxDurationSeconds: 3600,
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

export function getPlaybackUrl(streamUid: string): string | null {
  const sub = getCustomerSubdomain();
  if (sub) {
    return `https://${sub}/${streamUid}/manifest/video.m3u8`;
  }
  return null;
}

export async function resolvePlaybackUrl(streamUid: string): Promise<string | null> {
  const direct = getPlaybackUrl(streamUid);
  if (direct) return direct;
  const info = await getStreamVideo(streamUid);
  return info?.playbackHls ?? null;
}

export function aspectRatioFromVideo(info: StreamVideoInfo | null, fallback = 16 / 9): number {
  if (info?.width && info?.height && info.height > 0) {
    return info.width / info.height;
  }
  return fallback;
}
