import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import AppShell from "@/components/layout/AppShell";
import { DEFAULT_HOME_HERO_THEME } from "@/lib/homeHeroColors";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "XIIO — 다음 세대 콘텐츠 플랫폼",
  description: "영화, 예능, 시리즈, 학교 대항전 — 대학생이 만드는 새로운 콘텐츠",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="dark">
      <body className={`font-sans ${playfair.variable} ${inter.variable} min-w-[360px]`}>
        <Providers initialHomeTheme={DEFAULT_HOME_HERO_THEME}>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
