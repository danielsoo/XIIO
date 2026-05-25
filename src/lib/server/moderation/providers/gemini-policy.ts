import { MODERATION_CONFIDENCE, getGeminiApiKey } from "@/lib/server/moderation/config";
import type { ModerationFlag, ModerationFlagCode } from "@/types/moderation";
import type { PolicyModerationInput, PolicyModerationResult } from "@/lib/server/moderation/providers/types";

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

function severityFromConfidence(confidence: number, high: number, medium: number): ModerationFlag["severity"] | null {
  if (confidence >= high) return "high";
  if (confidence >= medium) return "medium";
  if (confidence >= medium * 0.85) return "low";
  return null;
}

function isFlagCode(v: string): v is ModerationFlagCode {
  return (
    v === "adult" ||
    v === "violence" ||
    v === "copyright_audio" ||
    v === "copyright_video" ||
    v === "policy_illegal"
  );
}

type GeminiJson = {
  summary?: string;
  flags?: { code?: string; confidence?: number; reason?: string }[];
};

export async function moderatePolicyWithGemini(input: PolicyModerationInput): Promise<PolicyModerationResult> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    return { flags: [], provider: "gemini", summary: undefined };
  }

  const metaBlock = [
    `제목: ${input.title}`,
    input.description ? `설명: ${input.description}` : null,
    input.director ? `감독: ${input.director}` : null,
    input.proposedCategory ? `카테고리: ${input.proposedCategory}` : null,
    input.proposedTags?.length ? `태그: ${input.proposedTags.join(", ")}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const parts: { text?: string; inlineData?: { mimeType: string; data: string } }[] = [
    {
      text: `당신은 UGC 플랫폼 XIIO의 콘텐츠 사전 검토 보조 AI입니다. 자동 거절은 하지 않으며, 관리자 심사용 플래그만 제안합니다.

다음 JSON만 출력하세요 (마크다운 없음):
{"summary":"한글 2~4문장 요약","flags":[{"code":"adult|violence|copyright_audio|copyright_video|policy_illegal","confidence":0.0-1.0,"reason":"짧은 한글 근거"}]}

플래그는 확실할 때만 포함하세요. 저작권·리믹스는 의심 수준만 표시하세요.

메타데이터:
${metaBlock}`,
    },
  ];

  for (const url of input.thumbnailUrls.slice(0, 4)) {
    try {
      const imgRes = await fetch(url);
      if (!imgRes.ok) continue;
      const buf = Buffer.from(await imgRes.arrayBuffer());
      if (buf.length > 4 * 1024 * 1024) continue;
      const mime = imgRes.headers.get("content-type")?.split(";")[0] || "image/jpeg";
      parts.push({
        inlineData: { mimeType: mime, data: buf.toString("base64") },
      });
    } catch {
      /* skip thumbnail */
    }
  }

  const res = await fetch(`${GEMINI_URL}?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 1024 },
    }),
  });

  const json = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
    error?: { message?: string };
  };

  if (!res.ok) {
    throw new Error(json.error?.message ?? `Gemini ${res.status}`);
  }

  const text = json.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ?? "";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) {
    return { flags: [], provider: "gemini", summary: text.slice(0, 500) || undefined };
  }

  let parsed: GeminiJson;
  try {
    parsed = JSON.parse(match[0]) as GeminiJson;
  } catch {
    return { flags: [], provider: "gemini", summary: text.slice(0, 500) };
  }

  const flags: ModerationFlag[] = [];
  for (const raw of parsed.flags ?? []) {
    const code = typeof raw.code === "string" ? raw.code : "";
    if (!isFlagCode(code)) continue;
    const confidence = Number(raw.confidence);
    if (!Number.isFinite(confidence)) continue;
    const high =
      code === "policy_illegal" || code.startsWith("copyright")
        ? MODERATION_CONFIDENCE.policyHigh
        : MODERATION_CONFIDENCE.adultHigh;
    const medium =
      code === "policy_illegal" || code.startsWith("copyright")
        ? MODERATION_CONFIDENCE.policyMedium
        : MODERATION_CONFIDENCE.adultMedium;
    const severity = severityFromConfidence(confidence, high, medium);
    if (!severity) continue;
    flags.push({
      code,
      severity,
      confidence: Math.min(1, Math.max(0, confidence)),
      detail: typeof raw.reason === "string" ? raw.reason : undefined,
    });
  }

  return {
    flags,
    summary: typeof parsed.summary === "string" ? parsed.summary.trim() : undefined,
    provider: "gemini",
  };
}
