import {
  creditDisplayNameMapKey,
  resolveWorkCreditDisplayNamePure,
  type CreditDisplayProfilePure,
} from "@/lib/credit-display-name-pure";
import type { WorkCreditRole } from "@/types/credits";

export { creditDisplayNameMapKey, resolveWorkCreditDisplayNamePure };
export type { CreditDisplayProfilePure };

export type CreditDisplayProfile = CreditDisplayProfilePure;

export function resolveWorkCreditDisplayName(
  profile: CreditDisplayProfile,
  role: WorkCreditRole
): string {
  return resolveWorkCreditDisplayNamePure(profile, role);
}
