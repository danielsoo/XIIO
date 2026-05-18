export type OnboardingStatsPayload = {
  total: number;
  watch: number;
  upload: number;
  other: number;
  /** ISO date string (UTC day) -> count of new signups that day */
  signupsByDay: Record<string, number>;
};
