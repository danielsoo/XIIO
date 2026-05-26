const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MIN_SIGNUP_AGE = 13;
const MAX_SIGNUP_AGE = 120;

export type BirthDateValidation = "empty" | "invalid" | "future" | "tooYoung" | "tooOld" | "ok";

export function parseBirthDateInput(value: string): Date | null {
  const trimmed = value.trim();
  if (!ISO_DATE_RE.test(trimmed)) return null;
  const [y, m, d] = trimmed.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  if (
    date.getFullYear() !== y ||
    date.getMonth() !== m - 1 ||
    date.getDate() !== d
  ) {
    return null;
  }
  return date;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function ageOnDate(birth: Date, asOf: Date): number {
  let age = asOf.getFullYear() - birth.getFullYear();
  const monthDiff = asOf.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && asOf.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age;
}

export function validateSignupBirthDate(
  date: Date | null,
  asOf: Date = new Date()
): BirthDateValidation {
  if (!date) return "empty";
  const today = startOfDay(asOf);
  const birth = startOfDay(date);
  if (birth > today) return "future";
  const age = ageOnDate(birth, today);
  if (age < MIN_SIGNUP_AGE) return "tooYoung";
  if (age > MAX_SIGNUP_AGE) return "tooOld";
  return "ok";
}

export function birthDateToIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function computeAgeFromBirthDate(iso: string, asOf: Date = new Date()): number | null {
  const parsed = parseBirthDateInput(iso);
  if (!parsed) return null;
  const age = ageOnDate(parsed, asOf);
  return age >= 0 ? age : null;
}

export function formatBirthDateForDisplay(iso: string, dateLocale: string): string {
  const parsed = parseBirthDateInput(iso);
  if (!parsed) return iso;
  return new Intl.DateTimeFormat(dateLocale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(parsed);
}

/** 가입일·히어로 메타 등과 맞춘 짧은 연·월·일 */
export function formatBirthDateShort(iso: string, dateLocale: string): string {
  const parsed = parseBirthDateInput(iso);
  if (!parsed) return iso;
  return new Intl.DateTimeFormat(dateLocale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(parsed);
}

export function maxBirthDateInputValue(asOf: Date = new Date()): string {
  return birthDateToIso(asOf);
}
