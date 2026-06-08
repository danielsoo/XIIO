export const profileInputClass =
  "w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-xiio-muted/60 focus:outline-none focus:ring-2 focus:ring-xiio-accent/40";

export const profileInputErrorClass = "border-red-400/50 focus:ring-red-400/30";

export const profileFieldErrorClass = "text-red-400 text-xs mt-1";

export function profileInitials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}
