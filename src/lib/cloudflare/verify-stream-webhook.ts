import { createHmac, timingSafeEqual } from "crypto";

const MAX_AGE_SEC = 600;

/**
 * Cloudflare Stream Webhook-Signature: time=UNIX,sig1=HEX
 * @see https://developers.cloudflare.com/stream/manage-video-library/using-webhooks/
 */
export function verifyStreamWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string
): { ok: true } | { ok: false; reason: string } {
  if (!signatureHeader?.trim()) {
    return { ok: false, reason: "missing_signature" };
  }

  let time: string | undefined;
  let sig1: string | undefined;

  for (const part of signatureHeader.split(",")) {
    const [key, value] = part.trim().split("=");
    if (key === "time") time = value;
    if (key === "sig1") sig1 = value;
  }

  if (!time || !sig1) {
    return { ok: false, reason: "malformed_signature" };
  }

  const ts = Number(time);
  if (!Number.isFinite(ts)) {
    return { ok: false, reason: "invalid_time" };
  }

  const ageSec = Math.abs(Date.now() / 1000 - ts);
  if (ageSec > MAX_AGE_SEC) {
    return { ok: false, reason: "timestamp_too_old" };
  }

  const source = `${time}.${rawBody}`;
  const expected = createHmac("sha256", secret).update(source).digest("hex");

  try {
    const a = Buffer.from(expected, "hex");
    const b = Buffer.from(sig1, "hex");
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return { ok: false, reason: "signature_mismatch" };
    }
  } catch {
    return { ok: false, reason: "signature_mismatch" };
  }

  return { ok: true };
}
