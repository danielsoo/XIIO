export type NaverUserProfile = {
  id: string;
  email: string | null;
  displayName: string | null;
};

type NaverTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

type NaverMeResponse = {
  resultcode?: string;
  message?: string;
  response?: {
    id?: string;
    email?: string;
    name?: string;
    nickname?: string;
  };
};

export function buildNaverAuthorizeUrl(params: {
  clientId: string;
  redirectUri: string;
  state: string;
}): string {
  const url = new URL("https://nid.naver.com/oauth2.0/authorize");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", params.clientId);
  url.searchParams.set("redirect_uri", params.redirectUri);
  url.searchParams.set("state", params.state);
  return url.toString();
}

export async function exchangeNaverToken(params: {
  code: string;
  state: string;
  clientId: string;
  clientSecret: string;
}): Promise<string | null> {
  const tokenUrl = new URL("https://nid.naver.com/oauth2.0/token");
  tokenUrl.searchParams.set("grant_type", "authorization_code");
  tokenUrl.searchParams.set("client_id", params.clientId);
  tokenUrl.searchParams.set("client_secret", params.clientSecret);
  tokenUrl.searchParams.set("code", params.code);
  tokenUrl.searchParams.set("state", params.state);

  const res = await fetch(tokenUrl.toString(), { method: "GET" });
  if (!res.ok) return null;

  const data = (await res.json()) as NaverTokenResponse;
  return data.access_token ?? null;
}

export async function fetchNaverProfile(accessToken: string): Promise<NaverUserProfile | null> {
  const res = await fetch("https://openapi.naver.com/v1/nid/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) return null;

  const data = (await res.json()) as NaverMeResponse;
  const profile = data.response;
  if (!profile?.id) return null;

  return {
    id: profile.id,
    email: profile.email?.trim() || null,
    displayName: (profile.name || profile.nickname)?.trim() || null,
  };
}
