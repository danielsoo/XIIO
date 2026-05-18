import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "XIIO — 다음 세대 콘텐츠 플랫폼",
  description: "영화, 예능, 시리즈, 쇼츠폼, 학교 대항전 — 대학생이 만드는 새로운 콘텐츠",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="dark">
      <body className="font-sans">
        <Providers>
          <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  );
}
