import type { VideoAspectRatio, WorkSection } from "@/types/work";

export type PublicWorkWatch = {
  workId: string;
  ownerUid: string;
  title: string;
  description?: string;
  director?: string;
  section: WorkSection;
  approvedCategory?: string;
  approvedTags: string[];
  approvedAspectRatio?: VideoAspectRatio;
  playbackUrl: string | null;
  embedUrl: string;
  thumbnailUrl?: string;
  durationSec?: number;
};
