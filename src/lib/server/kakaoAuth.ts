export type KakaoUserProfile = {
  id: string;
  email: string | null;
  displayName: string | null;
};

type KakaoMeResponse = {
  id?: number;
  kakao_account?: {
    email?: string;
    profile?: {
      nickname?: string;
    };
  };
};

export async function fetchKakaoProfile(accessToken: string): Promise<KakaoUserProfile | null> {
  const res = await fetch("https://kapi.kakao.com/v2/user/me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
    },
  });

  if (!res.ok) return null;

  const data = (await res.json()) as KakaoMeResponse;
  if (data.id == null) return null;

  return {
    id: String(data.id),
    email: data.kakao_account?.email?.trim() || null,
    displayName: data.kakao_account?.profile?.nickname?.trim() || null,
  };
}
