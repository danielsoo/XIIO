import { NextResponse } from "next/server";
import { fetchKakaoProfile } from "@/lib/server/kakaoAuth";
import {
  ADMIN_NOT_CONFIGURED,
  linkSocialProviderToUid,
} from "@/lib/server/socialAuth";
import { verifyBearerIdToken } from "@/lib/server/firebase-admin";

export async function POST(request: Request) {
  const session = await verifyBearerIdToken(request.headers.get("authorization"));
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

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
    await linkSocialProviderToUid({
      provider: "kakao",
      providerUserId: profile.id,
      uid: session.uid,
    });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "";
    if (message === ADMIN_NOT_CONFIGURED) {
      return NextResponse.json({ error: "admin_not_configured" }, { status: 503 });
    }
    console.error("[auth/kakao/link]", e);
    return NextResponse.json({ error: "link_failed" }, { status: 500 });
  }
}
