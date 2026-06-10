"use client";

import type { AppNavIcon } from "@/lib/appNav";

const iconClass = "w-[18px] h-[18px] shrink-0";
const sw = 1.5;

type Props = {
  icon: AppNavIcon;
  active?: boolean;
  className?: string;
};

export function AppNavIconSvg({ icon, active = false, className = iconClass }: Props) {
  switch (icon) {
    case "home":
      if (active) {
        return (
          <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M12 3.2 4 9.5V20h5v-6h6v6h5V9.5L12 3.2z" />
          </svg>
        );
      }
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={sw}
            d="M4 10.5L12 4l8 6.5V19a1 1 0 01-1 1h-4v-5H9v5H5a1 1 0 01-1-1v-8.5z"
          />
        </svg>
      );
    case "discover":
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <circle cx="11" cy="11" r="6.5" strokeWidth={sw} />
          <path strokeLinecap="round" strokeWidth={sw} d="M16.5 16.5L20 20" />
        </svg>
      );
    case "society":
      if (active) {
        return (
          <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M9 11a3 3 0 100-6 3 3 0 000 6zm8 0a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM3 19.5v-.75A4.5 4.5 0 019 14.5h.5a4.6 4.6 0 013.5 1.6 4.6 4.6 0 013.5-1.6h.5a4.5 4.5 0 014.5 4.5v.75H3zm10 0v-.5a3.5 3.5 0 013.5-3.5h.5a3 3 0 013 2.2V19.5H13z" />
          </svg>
        );
      }
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <circle cx="9" cy="8" r="3" strokeWidth={sw} />
          <circle cx="17" cy="9" r="2.5" strokeWidth={sw} />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={sw}
            d="M4 19.5v-.5a4 4 0 014-4h2a4 4 0 014 4v.5M14 19.5v-.25a3 3 0 013-3h1"
          />
        </svg>
      );
    case "series":
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <rect x="4" y="5" width="16" height="4" rx="1" strokeWidth={1.75} />
          <rect x="4" y="11" width="16" height="4" rx="1" strokeWidth={1.75} />
          <rect x="4" y="17" width="10" height="4" rx="1" strokeWidth={1.75} />
        </svg>
      );
    case "films":
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <rect x="3" y="5" width="18" height="14" rx="2" strokeWidth={1.75} />
          <path d="M10 9.5v5l4-2.5-4-2.5z" fill="currentColor" stroke="none" />
        </svg>
      );
    case "campus":
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.75}
            d="M4 11 12 5l8 6"
          />
          <rect x="5.5" y="11" width="4" height="9" rx="0.5" fill="none" strokeWidth={1.75} />
          <rect x="10" y="11" width="4" height="9" rx="0.5" fill="none" strokeWidth={1.75} />
          <rect x="14.5" y="11" width="4" height="9" rx="0.5" fill="none" strokeWidth={1.75} />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 20h16" />
          <path strokeLinecap="round" strokeWidth={2} d="M6 20h3M11 20h3M16 20h3" />
        </svg>
      );
    case "myList":
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeWidth={sw} d="M12 6v12M6 12h12" />
        </svg>
      );
    case "upload":
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.75}
            d="M12 16V6m0 0l-3 3m3-3l3 3M5 20h14"
          />
        </svg>
      );
    case "about":
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <rect x="5" y="3" width="14" height="18" rx="2" strokeWidth={sw} />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={sw}
            d="M9.5 8.75a2.5 2.5 0 114.2 1.5c-.7.55-1.2 1.15-1.2 2v.25"
          />
          <circle cx="12" cy="16.25" r="0.75" fill="currentColor" stroke="none" />
        </svg>
      );
    default:
      return null;
  }
}
