import type { Metadata } from "next";
import { Playfair_Display } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import AppShell from "@/components/layout/AppShell";
import { getServerHomeTheme } from "@/lib/server/home-theme";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "XIIO — 다음 세대 콘텐츠 플랫폼",
  description: "영화, 예능, 시리즈, 학교 대항전 — 대학생이 만드는 새로운 콘텐츠",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const initialHomeTheme = await getServerHomeTheme();

  return (
    <html lang="ko" className="dark">
      <body className={`font-sans ${playfair.variable}`}>
        <Providers initialHomeTheme={initialHomeTheme}>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
