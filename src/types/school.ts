export type SchoolStatus = "active" | "pending" | "merged";

/** Firestore `schools/{slug}` — canonical, self-serve-growable school registry */
export type SchoolDoc = {
  name: string;
  shortName: string;
  initials: string;
  slug: string;
  colorPrimary: string;
  colorSecondary: string;
  logoUrl?: string | null;
  status: SchoolStatus;
  /** set when status === "merged" — canonical slug to redirect to */
  mergedIntoSlug?: string;
  /** uid of the uploader whose upload first introduced this school */
  proposedBy?: string;
  /** denormalized count of published works tagged with this school */
  workCount?: number;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type SchoolListItem = SchoolDoc & { id: string };

export type SchoolSuggestion = {
  id: string;
  name: string;
  shortName: string;
  initials: string;
  logoUrl?: string | null;
  colorPrimary: string;
  colorSecondary: string;
};

export type SchoolStats = {
  workCount: number;
  movieCount: number;
  seriesCount: number;
  entertainmentCount: number;
};
