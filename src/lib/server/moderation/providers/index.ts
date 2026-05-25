import { getVideoModerationProvider } from "@/lib/server/moderation/config";
import { moderateVideoWithGoogle } from "@/lib/server/moderation/providers/google-video-intelligence";
import { moderateVideoWithHive } from "@/lib/server/moderation/providers/hive-visual";
import { moderateVideoWithSightengine } from "@/lib/server/moderation/providers/sightengine-video";
import type { VideoModerationInput, VideoModerationResult } from "@/lib/server/moderation/providers/types";

export { moderatePolicyWithGemini } from "@/lib/server/moderation/providers/gemini-policy";
export type { PolicyModerationInput, VideoModerationInput } from "@/lib/server/moderation/providers/types";

export async function moderateVideo(input: VideoModerationInput): Promise<VideoModerationResult> {
  const provider = getVideoModerationProvider();
  switch (provider) {
    case "hive":
      return moderateVideoWithHive(input);
    case "sightengine":
      return moderateVideoWithSightengine(input);
    case "google":
    default:
      return moderateVideoWithGoogle(input);
  }
}
