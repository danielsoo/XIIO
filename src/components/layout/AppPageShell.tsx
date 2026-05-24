import type { ReactNode } from "react";

/** Horizontal padding aligned with home hero (HomePageContent). */
export const PAGE_GUTTER = "px-4 sm:px-6 md:px-8 lg:px-10";

/** Max content width aligned with home hero grid. */
export const PAGE_CONTAINER = "mx-auto w-full max-w-7xl";

type Props = {
  children: ReactNode;
  /** Navbar visible — top offset for fixed nav (default). */
  withNavbar?: boolean;
  /** Uploader / no global Navbar — less top padding. */
  standalone?: boolean;
  className?: string;
};

export default function AppPageShell({
  children,
  withNavbar = true,
  standalone = false,
  className = "",
}: Props) {
  const pt = standalone ? "pt-6" : withNavbar ? "pt-24" : "pt-6";

  return (
    <main className={`min-h-screen bg-xiio-bg pb-16 ${pt} ${PAGE_GUTTER} ${className}`.trim()}>
      <div className={PAGE_CONTAINER}>{children}</div>
    </main>
  );
}
