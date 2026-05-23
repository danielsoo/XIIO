import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { exchangeNaverToken, fetchNaverProfile } from "@/lib/server/naverAuth";
import {
  ACCOUNT_EXISTS,
  ADMIN_NOT_CONFIGURED,
  findOrCreateFirebaseUser,
  getRequestOrigin,
} from "@/lib/server/socialAuth";

const STATE_COOKIE = "naver_oauth_state";

function redirectWithError(origin: string, code: string): NextResponse {
  const url = new URL("/auth/callback", origin);
  url.searchParams.set("error", code);
  const response = NextResponse.redirect(url);
  response.cookies.set(STATE_COOKIE, "", { httpOnly: true, maxAge: 0, path: "/" });
  return response;
}

export async function GET(request: Request) {
  const origin = getRequestOrigin(request);
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");

  if (oauthError) {
    return redirectWithError(origin, "naver_denied");
  }

  if (!code || !state) {
    return redirectWithError(origin, "naver_invalid");
  }

  const cookieStore = await cookies();
  const savedState = cookieStore.get(STATE_COOKIE)?.value;

  if (!savedState || savedState !== state) {
    return redirectWithError(origin, "naver_state_mismatch");
  }

  const clientId = process.env.NAVER_CLIENT_ID?.trim();
  const clientSecret = process.env.NAVER_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    return redirectWithError(origin, "naver_not_configured");
  }

  const redirectUri = `${origin}/api/auth/naver/callback`;
  const accessToken = await exchangeNaverToken({
    code,
    state,
    clientId,
    clientSecret,
  });

  if (!accessToken) {
    return redirectWithError(origin, "naver_token_failed");
  }

  const profile = await fetchNaverProfile(accessToken);
  if (!profile) {
    return redirectWithError(origin, "naver_profile_failed");
  }

  try {
    const { customToken } = await findOrCreateFirebaseUser({
      provider: "naver",
      providerUserId: profile.id,
      email: profile.email,
      displayName: profile.displayName,
    });

    const successUrl = new URL("/auth/callback", origin);
    successUrl.searchParams.set("token", customToken);
    const response = NextResponse.redirect(successUrl);
    response.cookies.set(STATE_COOKIE, "", { httpOnly: true, maxAge: 0, path: "/" });
    return response;
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "";
    if (message === ADMIN_NOT_CONFIGURED) {
      return redirectWithError(origin, "admin_not_configured");
    }
    if (message === ACCOUNT_EXISTS) {
      return redirectWithError(origin, "account_exists");
    }
    console.error("[auth/naver/callback]", e);
    return redirectWithError(origin, "auth_failed");
  }
}
