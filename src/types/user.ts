export type PlatformPurpose = "watch" | "upload";

export interface SignupProfile {
  displayName: string;
  age: number;
  isStudent: boolean;
  schoolName?: string;
  platformPurpose: PlatformPurpose;
}

export interface UserProfileDoc extends SignupProfile {
  email: string | null;
  createdAt?: unknown;
  updatedAt?: unknown;
}
