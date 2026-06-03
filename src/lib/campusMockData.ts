export type CampusSchool = {
  id: string;
  name: string;
  shortName: string;
  films: number;
  votes: string;
  color: string;
  initials: string;
  logo: string;
};

export type PastBattle = {
  id: string;
  schoolA: { name: string; initials: string; color: string; logo: string };
  schoolB: { name: string; initials: string; color: string; logo: string };
  winner: string;
  votes: string;
};

export const ACTIVE_BATTLE = {
  schoolA: {
    id: "psu",
    name: "PENN STATE UNIVERSITY",
    shortName: "Penn State",
    films: 8,
    votes: "2.4K",
    color: "#041E42",
    initials: "PS",
    logo: "/images/campus/schools/penn-state.svg",
  } satisfies CampusSchool,
  schoolB: {
    id: "osu",
    name: "OHIO STATE UNIVERSITY",
    shortName: "Ohio State",
    films: 7,
    votes: "2.1K",
    color: "#BB0000",
    initials: "OS",
    logo: "/images/campus/schools/ohio-state.svg",
  } satisfies CampusSchool,
  votingEndsAt: Date.now() + 2 * 24 * 3600 * 1000 + 14 * 3600 * 1000 + 32 * 60 * 1000 + 7 * 1000,
};

export const CURRENT_THEME = {
  title: "BEYOND THE SURFACE",
  description: "Show us the stories that lie beneath what we see everyday.",
  gradient: "from-cyan-900 via-blue-950 to-black",
};

export const PAST_BATTLES: PastBattle[] = [
  {
    id: "1",
    schoolA: { name: "UCLA", initials: "UCLA", color: "#2774AE", logo: "/images/campus/schools/ucla.svg" },
    schoolB: { name: "USC", initials: "USC", color: "#990000", logo: "/images/campus/schools/usc.svg" },
    winner: "UCLA",
    votes: "1.9K",
  },
  {
    id: "2",
    schoolA: { name: "NYU", initials: "NYU", color: "#57068C", logo: "/images/campus/schools/nyu.svg" },
    schoolB: { name: "Boston U", initials: "BU", color: "#CC0000", logo: "/images/campus/schools/boston-u.svg" },
    winner: "NYU",
    votes: "1.7K",
  },
  {
    id: "3",
    schoolA: { name: "Berkeley", initials: "CAL", color: "#003262", logo: "/images/campus/schools/berkeley.svg" },
    schoolB: { name: "Stanford", initials: "SU", color: "#8C1515", logo: "/images/campus/schools/stanford.svg" },
    winner: "Stanford",
    votes: "2.3K",
  },
];
