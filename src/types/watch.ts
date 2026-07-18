import type { VideoAspectRatio, WorkSection } from "@/types/work";
import type { WorkCreditRole } from "@/types/credits";

export type PublicWorkCredit = {
  id: string;
  userId: string;
  role: WorkCreditRole;
  displayName: string;
  characterName?: string;
  avatarUrl?: string | null;
  profileHref: string | null;
};

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
  credits: PublicWorkCredit[];
  approvedSchoolId?: string;
  approvedSchoolName?: string;
  prologue?: {
    playbackUrl: string | null;
    embedUrl: string;
    durationSec?: number;
    title?: string;
    description?: string;
  };
};
