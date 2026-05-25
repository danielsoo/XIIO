export const PORTFOLIO_SHARE_VISIBILITY = ["active", "revoked"] as const;

export type PortfolioShareVisibility = (typeof PORTFOLIO_SHARE_VISIBILITY)[number];

export const PROFESSIONAL_FIELDS = ["director", "actor", "crew", "multi"] as const;

export type ProfessionalField = (typeof PROFESSIONAL_FIELDS)[number];

export type PortfolioShareDoc = {
  token: string;
  title: string;
  includedWorkIds: string[];
  excludedWorkIds: string[];
  visibility: PortfolioShareVisibility;
  expiresAt?: unknown;
  viewCount: number;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type PortfolioWorkItem = {
  workId: string;
  ownerUid: string;
  title: string;
  description?: string;
  section?: string;
  director?: string;
  role: string;
  characterName?: string;
  streamUid?: string;
  playbackUrl?: string;
  thumbnailUrl?: string;
};

export type PublicPortfolioPayload = {
  profile: {
    displayName: string;
    handle: string;
    headline?: string;
    bio?: string;
    primaryField?: ProfessionalField;
    defaultDirectorName?: string;
  };
  shareTitle: string;
  works: PortfolioWorkItem[];
};
