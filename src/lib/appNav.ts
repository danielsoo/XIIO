export const APP_SIDEBAR_WIDTH = "12rem";

export const HIDE_APP_SHELL_PATHS = [
  "/login",
  "/signup",
  "/profiles",
  "/admin",
  "/uploader",
  "/auth",
];

const UPLOADER_IN_APP_SHELL_PREFIXES = [
  "/uploader/works",
  "/uploader/upload",
  "/uploader/analytics",
];

function isUploaderInAppShell(pathname: string): boolean {
  return UPLOADER_IN_APP_SHELL_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

export function shouldHideAppShell(pathname: string): boolean {
  if (isUploaderInAppShell(pathname)) {
    return false;
  }
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
  | "myList"
  | "messages"
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
  { id: "series", labelKey: "nav.series", href: "/series", icon: "series", section: "primary" },
  { id: "films", labelKey: "nav.films", href: "/movies", icon: "films", section: "primary" },
  {
    id: "schools",
    labelKey: "nav.schools",
    href: "/schools",
    icon: "campus",
    section: "primary",
  },
  { id: "society", labelKey: "nav.society", href: "/society", icon: "society", section: "primary" },
  {
    id: "messages",
    labelKey: "nav.messages",
    href: "/messages",
    icon: "messages",
    requiresAuth: true,
    section: "primary",
  },
  {
    id: "myList",
    labelKey: "nav.myList",
    href: "/my-list",
    icon: "myList",
    requiresAuth: true,
    section: "primary",
  },
];

export const SECONDARY_NAV: AppNavItem[] = [
  { id: "upload", labelKey: "nav.upload", href: "/uploader/upload", icon: "upload", section: "secondary" },
  { id: "about", labelKey: "nav.aboutXiio", href: "/about", icon: "about", section: "secondary" },
];
