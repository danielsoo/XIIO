/** Small pull-quote bank for the Films catalog's Critics' Picks row — deterministic per title. */

export type CriticsQuote = { quote: string; source: string };

const QUOTES: CriticsQuote[] = [
  { quote: "A quietly devastating debut.", source: "Festival Dispatch" },
  { quote: "Confident, unhurried, and completely its own thing.", source: "Campus Cinema Society" },
  { quote: "The best kind of first feature — one that trusts its audience.", source: "The Reel Review" },
  { quote: "Sharp, funny, and unexpectedly tender.", source: "Student Film Quarterly" },
  { quote: "Visually ambitious without ever showing off.", source: "Festival Dispatch" },
  { quote: "A small story told with real precision.", source: "The Reel Review" },
  { quote: "One of the most assured shorts of the season.", source: "Campus Cinema Society" },
  { quote: "Announces a genuine new voice.", source: "Student Film Quarterly" },
];

function hashStringToInt(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i++) h = (h * 31 + value.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function criticsQuoteFor(id: string): CriticsQuote {
  return QUOTES[hashStringToInt(id) % QUOTES.length]!;
}
