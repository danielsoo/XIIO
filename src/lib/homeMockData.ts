import type { CSSProperties } from "react";

export type HomeStoryItem = {
  id: string;
  title: string;
  category: string;
  duration: string;
  imageUrl: string;
  videoUrl?: string;
  href?: string;
  imageStyle?: CSSProperties;
  progressPercent?: number;
};

export const FEATURED_STORIES: HomeStoryItem[] = [
  {
    id: "1",
    title: "Concrete Bloom",
    category: "Short Film",
    duration: "23:11",
    imageUrl: "/images/home/featured/concrete-bloom.webp",
  },
  {
    id: "2",
    title: "Sink or Swim",
    category: "Experimental",
    duration: "08:32",
    imageUrl: "/images/home/featured/sink-or-swim.webp",
  },
  {
    id: "3",
    title: "9pm Conversation",
    category: "Drama",
    duration: "15:18",
    imageUrl: "/images/home/featured/9pm-conversation.webp",
  },
  {
    id: "4",
    title: "Almost, Maine",
    category: "Theater",
    duration: "22:45",
    imageUrl: "/images/home/featured/almost-maine.webp",
  },
  {
    id: "5",
    title: "The First Draft",
    category: "Documentary",
    duration: "18:00",
    imageUrl: "/images/home/featured/the-first-draft.webp",
  },
];

export const SURFACE_STORIES: HomeStoryItem[] = [
  {
    id: "s1",
    title: "Flicker",
    category: "Short Film",
    duration: "7:21",
    imageUrl: "/images/home/surface/flicker.webp",
  },
  {
    id: "s2",
    title: "Everything, Somewhere",
    category: "Experimental",
    duration: "9:44",
    imageUrl: "/images/home/surface/everything-somewhere.webp",
  },
  {
    id: "s3",
    title: "Rooftop Sound",
    category: "Music Video",
    duration: "4:30",
    imageUrl: "/images/home/surface/rooftop-sound.webp",
  },
  {
    id: "s4",
    title: "Distant Land",
    category: "Short Film",
    duration: "11:20",
    imageUrl: "/images/home/surface/distant-land.webp",
  },
];

export const SELECTS_STORIES: HomeStoryItem[] = [
  {
    id: "x1",
    title: "Midnight Ferry",
    category: "Short Film",
    duration: "14:02",
    imageUrl: "/images/home/selects/midnight-ferry.webp",
  },
  {
    id: "x2",
    title: "Glass Garden",
    category: "Series Pilot",
    duration: "24:00",
    imageUrl: "/images/home/selects/glass-garden.webp",
  },
  {
    id: "x3",
    title: "Northbound",
    category: "Documentary",
    duration: "16:45",
    imageUrl: "/images/home/selects/northbound.webp",
  },
  {
    id: "x4",
    title: "Paper Moon",
    category: "Drama",
    duration: "10:08",
    imageUrl: "/images/home/selects/paper-moon.webp",
  },
];

export const DEFAULT_FEATURED_STORY = {
  title: "Tide Marks",
  category: "Short Film",
  duration: "18:24",
};

export const CAMPUS_CURRENTS_MAP = "/images/home/campus-currents-map.webp";
