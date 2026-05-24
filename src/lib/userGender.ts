import type { UserGender } from "@/types/user";

export const USER_GENDERS: UserGender[] = ["male", "female", "undisclosed"];

const GENDER_MESSAGE_KEYS: Record<UserGender, string> = {
  male: "auth.signup.genderMale",
  female: "auth.signup.genderFemale",
  undisclosed: "auth.signup.genderUndisclosed",
};

export function genderLabelKey(gender: UserGender): string {
  return GENDER_MESSAGE_KEYS[gender];
}
