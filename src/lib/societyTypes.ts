import type { ProfileRoleTag } from "@/types/portfolio";

export type SocietyPerson = {
  uid: string;
  handle: string;
  displayName: string;
  headline?: string;
  bio?: string;
  roleTags: ProfileRoleTag[];
  openToCollaborate: boolean;
  collaborationNote?: string;
  followerCount: number;
};
