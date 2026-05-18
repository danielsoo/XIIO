const GRADIENTS = [
  "bg-gradient-to-br from-blue-900 to-purple-900",
  "bg-gradient-to-br from-gray-800 to-gray-900",
  "bg-gradient-to-br from-pink-900 to-rose-900",
  "bg-gradient-to-br from-orange-900 to-red-900",
  "bg-gradient-to-br from-cyan-900 to-blue-900",
  "bg-gradient-to-br from-purple-900 to-violet-900",
  "bg-gradient-to-br from-green-800 to-teal-900",
  "bg-gradient-to-br from-amber-800 to-orange-900",
];

export function gradientForTitle(title: string): string {
  let h = 0;
  for (let i = 0; i < title.length; i++) h = (h + title.charCodeAt(i)) % GRADIENTS.length;
  return GRADIENTS[h]!;
}
