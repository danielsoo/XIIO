export type StreamDirectUpload = {
  uploadURL: string;
  uid: string;
};

function getAccountId(): string | null {
  return process.env.CLOUDFLARE_ACCOUNT_ID ?? null;
}

function getApiToken(): string | null {
  return process.env.CLOUDFLARE_STREAM_API_TOKEN ?? null;
}

export function isStreamConfigured(): boolean {
  return !!(getAccountId() && getApiToken());
}

export async function createDirectUpload(meta: Record<string, string>): Promise<StreamDirectUpload> {
  const accountId = getAccountId();
  const token = getApiToken();
  if (!accountId || !token) {
    throw new Error("Cloudflare Stream not configured");
  }

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/direct_upload`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        maxDurationSeconds: 3600,
        requireSignedURLs: false,
        meta,
      }),
    }
  );

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
