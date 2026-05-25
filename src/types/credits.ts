export const WORK_CREDIT_ROLES = [
  "director",
  "actor",
  "writer",
  "cinematography",
  "lighting",
  "sound",
  "edit",
  "production",
  "other",
] as const;

export type WorkCreditRole = (typeof WORK_CREDIT_ROLES)[number];

export const WORK_CREDIT_STATUSES = ["pending", "accepted", "declined"] as const;

export type WorkCreditStatus = (typeof WORK_CREDIT_STATUSES)[number];

export type WorkCredit = {
  id: string;
  userId: string;
  role: WorkCreditRole;
  displayName?: string;
  characterName?: string;
  sortOrder: number;
  status: WorkCreditStatus;
  createdAt?: unknown;
  updatedAt?: unknown;
};

/** API upload body — credit without id */
export type WorkCreditInput = {
  userId: string;
  role: WorkCreditRole;
  characterName?: string;
  sortOrder?: number;
};

/** users/{uid}/creditIndex/{workId} — 역인덱스 for filmography */
export type CreditIndexDoc = {
  ownerUid: string;
  workId: string;
  role: WorkCreditRole;
  characterName?: string;
  workTitle: string;
  workSection?: string;
  platformStatus: string;
  streamUid?: string;
  creditedAt?: unknown;
};
