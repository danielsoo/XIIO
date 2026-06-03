export const BRAND_EFFECTS = ["nebula", "ink", "electric", "ember"] as const;
export type BrandEffect = (typeof BRAND_EFFECTS)[number];

const WEIGHTED_EFFECTS: { effect: BrandEffect; weight: number }[] = [
  { effect: "nebula", weight: 40 },
  { effect: "ink", weight: 25 },
  { effect: "electric", weight: 20 },
  { effect: "ember", weight: 15 },
];

const TOTAL_WEIGHT = WEIGHTED_EFFECTS.reduce((s, e) => s + e.weight, 0);

function hashSeed(seed: string): number {
  let h = 5381;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 33) ^ seed.charCodeAt(i);
  }
  return Math.abs(h);
}

/** ISO week key for stable weekly rotation (SSR-safe when called with same date). */
export function getRotationEpoch(mode: "week" | "day" = "week"): string {
  const d = new Date();
  if (mode === "day") {
    return d.toISOString().slice(0, 10);
  }
  const thursday = new Date(d);
  thursday.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const yearStart = new Date(thursday.getFullYear(), 0, 4);
  const week =
    1 +
    Math.round(
      ((thursday.getTime() - yearStart.getTime()) / 86400000 -
        3 +
        ((yearStart.getDay() + 6) % 7)) /
        7
    );
  return `${thursday.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function resolveBrandEffect(seed: string): BrandEffect {
  const bucket = hashSeed(seed) % TOTAL_WEIGHT;
  let acc = 0;
  for (const { effect, weight } of WEIGHTED_EFFECTS) {
    acc += weight;
    if (bucket < acc) return effect;
  }
  return "nebula";
}

export function buildEffectSeed(
  schoolId: string,
  battleId: string,
  side: "left" | "right",
  epoch: string
): string {
  return `${schoolId}:${battleId}:${side}:${epoch}`;
}
