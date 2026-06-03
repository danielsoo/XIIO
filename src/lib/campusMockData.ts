export type CampusSchoolBrand = {
  id: string;
  name: string;
  shortName: string;
  films: number;
  votes: string;
  colorPrimary: string;
  colorSecondary: string;
  /** @deprecated use colorPrimary */
  color: string;
  initials: string;
  logo: string;
};

export type CampusSchool = CampusSchoolBrand;

export type PastBattleSchool = {
  id: string;
  name: string;
  initials: string;
  colorPrimary: string;
  colorSecondary: string;
  color: string;
  logo: string;
};

export type PastBattle = {
  id: string;
  schoolA: PastBattleSchool;
  schoolB: PastBattleSchool;
  winner: string;
  votes: string;
};

function school(
  partial: Omit<CampusSchoolBrand, "color"> & { color?: string }
): CampusSchoolBrand {
  const colorPrimary = partial.colorPrimary ?? partial.color ?? "#ffffff";
  return {
    ...partial,
    colorPrimary,
    colorSecondary: partial.colorSecondary,
    color: colorPrimary,
  };
}

function pastSchool(
  id: string,
  name: string,
  initials: string,
  colorPrimary: string,
  colorSecondary: string,
  logo: string
): PastBattleSchool {
  return { id, name, initials, colorPrimary, colorSecondary, color: colorPrimary, logo };
}

export const ACTIVE_BATTLE = {
  schoolA: school({
    id: "psu",
    name: "PENN STATE UNIVERSITY",
    shortName: "Penn State",
    films: 8,
    votes: "2.4K",
    colorPrimary: "#041E42",
    colorSecondary: "#FFFFFF",
    initials: "PS",
    logo: "/images/campus/schools/psu.png",
  }),
  schoolB: school({
    id: "osu",
    name: "OHIO STATE UNIVERSITY",
    shortName: "Ohio State",
    films: 7,
    votes: "2.1K",
    colorPrimary: "#BB0000",
    colorSecondary: "#666666",
    initials: "OS",
    logo: "/images/campus/schools/osu.webp",
  }),
  votingEndsAt:
    Date.now() + 2 * 24 * 3600 * 1000 + 14 * 3600 * 1000 + 32 * 60 * 1000 + 7 * 1000,
};

export const CURRENT_THEME = {
  gradient: "from-cyan-900 via-blue-950 to-black",
  image: "/images/campus/theme-beyond-surface.webp",
};

export const PAST_BATTLES: PastBattle[] = [
  {
    id: "1",
    schoolA: pastSchool(
      "ucla",
      "UCLA",
      "UCLA",
      "#2774AE",
      "#FFD100",
      "/images/campus/schools/ucla.jpg"
    ),
    schoolB: pastSchool(
      "usc",
      "USC",
      "USC",
      "#990000",
      "#FFCC00",
      "/images/campus/schools/usc.svg"
    ),
    winner: "UCLA",
    votes: "1.9K",
  },
  {
    id: "2",
    schoolA: pastSchool(
      "nyu",
      "NYU",
      "NYU",
      "#57068C",
      "#FFFFFF",
      "/images/campus/schools/nyu.webp"
    ),
    schoolB: pastSchool(
      "bu",
      "Boston U",
      "BU",
      "#CC0000",
      "#FFFFFF",
      "/images/campus/schools/bu.png"
    ),
    winner: "NYU",
    votes: "1.7K",
  },
  {
    id: "3",
    schoolA: pastSchool(
      "berkeley",
      "Berkeley",
      "CAL",
      "#003262",
      "#FDB515",
      "/images/campus/schools/berkeley.png"
    ),
    schoolB: pastSchool(
      "stanford",
      "Stanford",
      "SU",
      "#8C1515",
      "#FFFFFF",
      "/images/campus/schools/stanford.webp"
    ),
    winner: "Stanford",
    votes: "2.3K",
  },
];
