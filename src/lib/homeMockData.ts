export type HomeStoryItem = {
  id: string;
  title: string;
  category: string;
  duration: string;
  gradient: string;
  href?: string;
};

export const FEATURED_STORIES: HomeStoryItem[] = [
  { id: "1", title: "Concrete Bloom", category: "Short Film", duration: "12:04", gradient: "from-slate-700 via-slate-900 to-black" },
  { id: "2", title: "Sink or Swim", category: "Experimental", duration: "08:32", gradient: "from-teal-900 via-cyan-950 to-black" },
  { id: "3", title: "9pm Conversation", category: "Drama", duration: "15:18", gradient: "from-indigo-900 via-violet-950 to-black" },
  { id: "4", title: "Almost, Maine", category: "Theater", duration: "22:45", gradient: "from-rose-900 via-red-950 to-black" },
  { id: "5", title: "The First Draft", category: "Documentary", duration: "18:00", gradient: "from-amber-900 via-orange-950 to-black" },
];

export const SURFACE_STORIES: HomeStoryItem[] = [
  { id: "s1", title: "Flicker", category: "Short Film", duration: "06:12", gradient: "from-zinc-800 to-black" },
  { id: "s2", title: "Everything, Somewhere", category: "Experimental", duration: "09:44", gradient: "from-blue-950 to-black" },
  { id: "s3", title: "Rooftop Sound", category: "Music Video", duration: "04:30", gradient: "from-purple-950 to-black" },
  { id: "s4", title: "Distant Land", category: "Short Film", duration: "11:20", gradient: "from-emerald-950 to-black" },
];

export const SELECTS_STORIES: HomeStoryItem[] = [
  { id: "x1", title: "Midnight Ferry", category: "Short Film", duration: "14:02", gradient: "from-sky-950 to-black" },
  { id: "x2", title: "Glass Garden", category: "Series Pilot", duration: "24:00", gradient: "from-fuchsia-950 to-black" },
  { id: "x3", title: "Northbound", category: "Documentary", duration: "16:45", gradient: "from-stone-800 to-black" },
  { id: "x4", title: "Paper Moon", category: "Drama", duration: "10:08", gradient: "from-cyan-950 to-black" },
];

export const DEFAULT_FEATURED_STORY = {
  title: "Tide Marks",
  category: "Short Film",
  duration: "18:24",
};
