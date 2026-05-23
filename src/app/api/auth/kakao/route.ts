import { NextResponse } from "next/server";
import { fetchKakaoProfile } from "@/lib/server/kakaoAuth";
import {
  ACCOUNT_EXISTS,
  ADMIN_NOT_CONFIGURED,
  findOrCreateFirebaseUser,
} from "@/lib/server/socialAuth";

export async function POST(request: Request) {
  let body: { accessToken?: string };
  try {
    body = (await request.json()) as { accessToken?: string };
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const accessToken = body.accessToken?.trim();
  if (!accessToken) {
    return NextResponse.json({ error: "missing_token" }, { status: 400 });
  }

  const profile = await fetchKakaoProfile(accessToken);
  if (!profile) {
    return NextResponse.json({ error: "invalid_kakao_token" }, { status: 401 });
  }

  try {
    const { customToken } = await findOrCreateFirebaseUser({
      provider: "kakao",
      providerUserId: profile.id,
      email: profile.email,
      displayName: profile.displayName,
    });
    return NextResponse.json({ customToken });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "";
    if (message === ADMIN_NOT_CONFIGURED) {
      return NextResponse.json({ error: "admin_not_configured" }, { status: 503 });
    }
    if (message === ACCOUNT_EXISTS) {
      return NextResponse.json({ error: "account_exists" }, { status: 409 });
    }
    console.error("[auth/kakao]", e);
    return NextResponse.json({ error: "auth_failed" }, { status: 500 });
  }
}
