import type { ReactNode } from "react";

/** AppShell content inset from the final imported redesign. */
export const PAGE_GUTTER_IN_SHELL = "px-4 lg:px-12";

/** AppShell 밖 standalone (verify 등) */
export const PAGE_GUTTER_STANDALONE = "px-4 sm:px-6 md:px-8 lg:px-10";

/** @deprecated PAGE_GUTTER_IN_SHELL 사용 */
export const PAGE_GUTTER = PAGE_GUTTER_IN_SHELL;

/** Max content width aligned with the 1400px handoff grid. */
export const PAGE_CONTAINER = "mx-auto w-full max-w-[1400px]";

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
  const pt = standalone ? "pt-6" : withNavbar ? "pt-6" : "pt-6";
  const gutter = standalone ? PAGE_GUTTER_STANDALONE : PAGE_GUTTER_IN_SHELL;

  return (
    <main className={`min-h-screen bg-xiio-bg pb-16 ${pt} ${gutter} ${className}`.trim()}>
      <div className={PAGE_CONTAINER}>{children}</div>
    </main>
  );
}
