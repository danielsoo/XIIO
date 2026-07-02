"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/context/LocaleContext";
import ProfileMenu from "@/components/ProfileMenu";

const HIDE_NAV_PATHS = ["/login", "/signup", "/profiles", "/admin", "/uploader", "/auth"];

export default function Navbar() {
  const { user } = useAuth();
  const { t } = useTranslations();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = useMemo(
    () => [
      { label: t("nav.movies"), href: "/movies" },
      { label: t("nav.entertainment"), href: "/entertainment" },
      { label: t("nav.series"), href: "/series" },
      { label: t("nav.schools"), href: "/schools" },
    ],
    [t]
  );

  const myListItem = useMemo(
    () => ({ label: t("nav.myList"), href: "/my-list" }),
    [t]
  );

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (HIDE_NAV_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return null;
  }

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 h-16 flex items-center px-6 transition-all duration-300 ${
        scrolled
          ? "bg-xiio-bg/95 backdrop-blur-md border-b border-white/10"
          : "bg-gradient-to-b from-black/70 to-transparent"
      }`}
    >
      <Link href="/" className="flex-shrink-0 mr-10">
        <span className="text-2xl font-black tracking-widest text-white">
          X<span className="text-xiio-accent">II</span>O
        </span>
      </Link>

      <ul className="hidden md:flex items-center gap-7 flex-1">
        {navItems.map(({ label, href }) => (
          <li key={href}>
            <Link
              href={href}
              className={`text-sm font-medium transition-colors ${
                pathname === href ? "text-white" : "text-xiio-muted hover:text-white"
              }`}
            >
              {label}
            </Link>
          </li>
        ))}
        {user ? (
          <li>
            <Link
              href={myListItem.href}
              className={`text-sm font-medium transition-colors ${
                pathname === myListItem.href ? "text-white" : "text-xiio-muted hover:text-white"
              }`}
            >
              {myListItem.label}
            </Link>
          </li>
        ) : null}
      </ul>

      <div className="hidden md:flex items-center ml-auto">
        {user ? (
          <ProfileMenu />
        ) : (
          <Link
            href="/login"
            className="text-sm px-4 py-1.5 rounded bg-xiio-accent hover:bg-xiio-accent-hover text-white font-medium transition"
          >
            {t("common.login")}
          </Link>
        )}
      </div>

      <div className="md:hidden flex items-center gap-2 ml-auto">
        {!user && (
          <Link
            href="/login"
            className="text-sm px-3 py-1.5 rounded bg-xiio-accent hover:bg-xiio-accent-hover text-white font-medium transition"
          >
            {t("common.login")}
          </Link>
        )}
        {user && <ProfileMenu />}
        <button
          type="button"
          className="text-white"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={t("nav.menuOpen")}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-xiio-bg border-b border-white/10 px-6 py-4 flex flex-col gap-4">
          {navItems.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMenuOpen(false)}
              className="text-sm text-xiio-muted hover:text-white transition"
            >
              {label}
            </Link>
          ))}
          {user ? (
            <Link
              href={myListItem.href}
              onClick={() => setMenuOpen(false)}
              className="text-sm text-xiio-muted hover:text-white transition"
            >
              {myListItem.label}
            </Link>
          ) : null}
          {!user && (
            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="text-sm text-xiio-accent font-medium border-t border-white/10 pt-4"
            >
              {t("common.login")}
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
