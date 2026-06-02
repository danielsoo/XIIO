"use client";

import type { AppNavIcon } from "@/lib/appNav";

const iconClass = "w-[18px] h-[18px] shrink-0";

export function AppNavIconSvg({ icon, className = iconClass }: { icon: AppNavIcon; className?: string }) {
  switch (icon) {
    case "home":
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 10.5L12 4l9 6.5V20a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1v-9.5z" />
        </svg>
      );
    case "series":
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 6h16M4 10h16M4 14h10M4 18h10" />
        </svg>
      );
    case "films":
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M14.5 4h-5L9 7H5v13h14V7h-4l-1.5-3z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M10 11l4 2.5-4 2.5V11z" fill="currentColor" stroke="none" />
        </svg>
      );
    case "campus":
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" />
        </svg>
      );
    case "creators":
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 11a4 4 0 11-8 0 4 4 0 018 0zM3 21v-1a6 6 0 0112 0v1" />
        </svg>
      );
    case "myList":
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 5v14M5 12h14" />
        </svg>
      );
    case "upload":
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 16V4m0 0l-4 4m4-4l4 4M4 20h16" />
        </svg>
      );
    case "about":
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 16v-4m0-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
        </svg>
      );
    default:
      return null;
  }
}
