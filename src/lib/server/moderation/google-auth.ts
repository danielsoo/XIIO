import { GoogleAuth } from "google-auth-library";

const CLOUD_PLATFORM_SCOPE = "https://www.googleapis.com/auth/cloud-platform";

let cachedAuth: GoogleAuth | null | undefined;

function getGoogleAuth(): GoogleAuth | null {
  if (cachedAuth !== undefined) return cachedAuth;

  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (json) {
    try {
      cachedAuth = new GoogleAuth({
        credentials: JSON.parse(json) as Record<string, unknown>,
        scopes: [CLOUD_PLATFORM_SCOPE],
      });
      return cachedAuth;
    } catch (e) {
      console.error("[moderation] Invalid FIREBASE_SERVICE_ACCOUNT_JSON", e);
      cachedAuth = null;
      return null;
    }
  }

  try {
    cachedAuth = new GoogleAuth({ scopes: [CLOUD_PLATFORM_SCOPE] });
    return cachedAuth;
  } catch {
    cachedAuth = null;
    return null;
  }
}

export async function getGoogleCloudAccessToken(): Promise<string | null> {
  const auth = getGoogleAuth();
  if (!auth) return null;
  try {
    const client = await auth.getClient();
    const token = await client.getAccessToken();
    return token.token ?? null;
  } catch (e) {
    console.error("[moderation] Google access token failed", e);
    return null;
  }
}
