export type TransitionMode = "revolve" | "fade";

export function getTransitionMode(prev: number, next: number, count: number): TransitionMode {
  if (count <= 1 || prev === next) return "fade";
  if (prev === count - 1 && next === 0) return "fade";
  if (prev === 0 && next === count - 1) return "fade";
  let step = next - prev;
  if (step < 0) step += count;
  if (step === 1 || step === count - 1) return "revolve";
  return "fade";
}

export function getRevolveDirection(
  prev: number,
  next: number,
  count: number
): 1 | -1 {
  let step = next - prev;
  if (step < 0) step += count;
  return step === 1 ? 1 : -1;
}

export const REVOLVE_MS = 500;
export const FADE_MS = 300;
