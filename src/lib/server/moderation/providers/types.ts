import type { ModerationFlag } from "@/types/moderation";

export type VideoModerationInput = {
  streamUid: string;
  videoUrl: string | null;
  thumbnailUrls: string[];
  title: string;
  description?: string;
};

export type VideoModerationResult = {
  flags: ModerationFlag[];
  provider: string;
  skipped?: boolean;
  skipReason?: string;
};

export type PolicyModerationInput = {
  title: string;
  description?: string;
  director?: string;
  proposedCategory?: string;
  proposedTags?: string[];
  thumbnailUrls: string[];
};

export type PolicyModerationResult = {
  flags: ModerationFlag[];
  summary?: string;
  provider: string;
};
