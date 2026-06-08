export const APP_SIDEBAR_WIDTH = "12rem";

export const HIDE_APP_SHELL_PATHS = [
  "/login",
  "/signup",
  "/profiles",
  "/admin",
  "/uploader",
  "/auth",
];

export function shouldHideAppShell(pathname: string): boolean {
  return HIDE_APP_SHELL_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

export type AppNavIcon =
  | "home"
  | "discover"
  | "films"
  | "campus"
  | "society"
  | "series"
  | "creators"
  | "myList"
  | "upload"
  | "about";

export type AppNavItem = {
  id: string;
  labelKey: string;
  href: string;
  icon: AppNavIcon;
  badgeKey?: string;
  requiresAuth?: boolean;
  section?: "primary" | "secondary";
};

export const PRIMARY_NAV: AppNavItem[] = [
  { id: "home", labelKey: "nav.home", href: "/", icon: "home", section: "primary" },
  { id: "discover", labelKey: "nav.discover", href: "/creators", icon: "discover", section: "primary" },
  {
    id: "campus",
    labelKey: "nav.campus",
    href: "/school-battle",
    icon: "campus",
    badgeKey: "nav.campusNew",
    section: "primary",
  },
  { id: "films", labelKey: "nav.films", href: "/movies", icon: "films", section: "primary" },
  { id: "society", labelKey: "nav.society", href: "/society", icon: "society", section: "primary" },
];

export const SECONDARY_NAV: AppNavItem[] = [
  { id: "upload", labelKey: "nav.upload", href: "/uploader/upload", icon: "upload", section: "secondary" },
  { id: "about", labelKey: "nav.aboutXiio", href: "/about", icon: "about", section: "secondary" },
];
