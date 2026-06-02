"use client";

import type { AppNavIcon } from "@/lib/appNav";

const iconClass = "w-[18px] h-[18px] shrink-0";
const sw = 1.75;

export function AppNavIconSvg({ icon, className = iconClass }: { icon: AppNavIcon; className?: string }) {
  switch (icon) {
    case "home":
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
    case "series":
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <rect x="4" y="5" width="16" height="4" rx="1" strokeWidth={sw} />
          <rect x="4" y="11" width="16" height="4" rx="1" strokeWidth={sw} />
          <rect x="4" y="17" width="10" height="4" rx="1" strokeWidth={sw} />
        </svg>
      );
    case "films":
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <rect x="3" y="5" width="18" height="14" rx="2" strokeWidth={sw} />
          <path d="M10 9.5v5l4-2.5-4-2.5z" fill="currentColor" stroke="none" />
        </svg>
      );
    case "campus":
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={sw} d="M4 20h16M6 20V8l6-4 6 4v12" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={sw} d="M10 20v-5h4v5" />
        </svg>
      );
    case "creators":
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <circle cx="12" cy="8" r="3.5" strokeWidth={sw} />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={sw} d="M5 20v-1a5 5 0 0110 0v1" />
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
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={sw} d="M12 16V6m0 0l-3 3m3-3l3 3M5 20h14" />
        </svg>
      );
    case "about":
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <rect x="5" y="3" width="14" height="18" rx="2" strokeWidth={sw} />
          <path strokeLinecap="round" strokeWidth={sw} d="M12 8v5M12 16h.01" />
        </svg>
      );
    default:
      return null;
  }
}
