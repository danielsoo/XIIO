import { FieldValue, type Firestore } from "firebase-admin/firestore";
import {
  resolveModerationVideoUrl,
  sampleStreamThumbnailUrls,
} from "@/lib/cloudflare/stream";
import { isContentModerationEnabled } from "@/lib/server/moderation/config";
import { mergeModerationFlags } from "@/lib/server/moderation/merge-flags";
import { moderationHasHighSeverity } from "@/lib/server/moderation/parse-content-moderation";
import { moderatePolicyWithGemini, moderateVideo } from "@/lib/server/moderation/providers";
import { promoRef, worksCol } from "@/lib/server/works";
import type { ContentModeration } from "@/types/moderation";

export type ModerationTargetKind = "full" | "promo" | "full_revision" | "promo_revision";

export type RunContentModerationParams = {
  ownerUid: string;
  workId: string;
  streamUid: string;
  kind: ModerationTargetKind;
  title: string;
  description?: string;
  director?: string;
  proposedCategory?: string;
  proposedTags?: string[];
};

function moderationRef(db: Firestore, params: RunContentModerationParams) {
  const { ownerUid, workId, kind } = params;
  if (kind === "promo" || kind === "promo_revision") {
    return promoRef(db, ownerUid, workId);
  }
  return worksCol(db, ownerUid).doc(workId);
}

function moderationFieldPath(kind: ModerationTargetKind): string {
  if (kind === "full_revision" || kind === "promo_revision") {
    return "pendingRevision.contentModeration";
  }
  return "contentModeration";
}

export async function runContentModeration(
  db: Firestore,
  params: RunContentModerationParams
): Promise<void> {
  if (!isContentModerationEnabled()) return;

  const ref = moderationRef(db, params);
  const fieldPath = moderationFieldPath(params.kind);

  const pending: ContentModeration = {
    status: "pending",
    flags: [],
    providers: [],
    streamUid: params.streamUid,
  };

  await ref.set(
    {
      [fieldPath]: pending,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  try {
    const [videoUrl, thumbnailUrls] = await Promise.all([
      resolveModerationVideoUrl(params.streamUid),
      sampleStreamThumbnailUrls(params.streamUid, 4),
    ]);

    const [videoResult, policyResult] = await Promise.all([
      moderateVideo({
        streamUid: params.streamUid,
        videoUrl,
        thumbnailUrls,
        title: params.title,
        description: params.description,
      }),
      moderatePolicyWithGemini({
        title: params.title,
        description: params.description,
        director: params.director,
        proposedCategory: params.proposedCategory,
        proposedTags: params.proposedTags,
        thumbnailUrls,
      }),
    ]);

    const flags = mergeModerationFlags(videoResult.flags, policyResult.flags);
    const providers = [
      videoResult.skipped ? `${videoResult.provider}(skipped)` : videoResult.provider,
      policyResult.provider,
    ].filter(Boolean);

    const completed: ContentModeration = {
      status: "completed",
      flags,
      summary: policyResult.summary,
      providers,
      streamUid: params.streamUid,
      analyzedAt: FieldValue.serverTimestamp(),
      hasHighSeverity: moderationHasHighSeverity(flags),
    };

    if (videoResult.skipped && flags.length === 0 && !policyResult.summary) {
      completed.status = "skipped";
      completed.error = videoResult.skipReason ?? "video_provider_skipped";
    }

    await ref.set(
      {
        [fieldPath]: completed,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[content-moderation] failed", params, message);
    const failed: ContentModeration = {
      status: "failed",
      flags: [],
      providers: [],
      streamUid: params.streamUid,
      error: message.slice(0, 500),
      analyzedAt: FieldValue.serverTimestamp(),
      hasHighSeverity: false,
    };
    await ref.set(
      {
        [fieldPath]: failed,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  }
}
