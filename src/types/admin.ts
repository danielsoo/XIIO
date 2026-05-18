export type OnboardingStatsPayload = {
  total: number;
  watch: number;
  upload: number;
  other: number;
  signupsByDay: Record<string, number>;
};

import type { PlatformPurpose, UserRole } from "@/types/user";
import type { PlatformStatus, PromoPlatformStatus, StreamStatus, WorkDoc, WorkSection } from "@/types/work";

export type AdminUserWorkSummary = {
  id: string;
  title: string;
  section: WorkSection;
  platformStatus: PlatformStatus;
  streamStatus: StreamStatus;
  proposedCategory?: string;
  approvedCategory?: string;
  createdAt?: unknown;
};

export type AdminUserDetail = {
  uid: string;
  displayName: string;
  email: string | null;
  emailVerified: boolean;
  age: number;
  isStudent: boolean;
  schoolName?: string;
  platformPurpose: PlatformPurpose;
  role: UserRole;
  createdAt?: unknown;
  updatedAt?: unknown;
  visitCount: number;
  lastVisitAt?: unknown;
  depositVerified: boolean;
  works: AdminUserWorkSummary[];
};

export type AdminWorkDetailOwner = {
  uid: string;
  email: string | null;
  displayName: string;
};

export type AdminWorkDetail = {
  work: WorkDoc & { id: string };
  owner: AdminWorkDetailOwner;
  playbackUrl?: string;
  promo?: {
    id: string;
    platformStatus: PromoPlatformStatus;
    streamStatus?: StreamStatus;
    clipStartSec: number;
    clipEndSec: number;
    title?: string;
    playbackUrl?: string;
    deletionRequest?: WorkDoc["deletionRequest"];
    rejectReason?: string;
  };
};
