import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        xiio: {
          bg: "#0b0b0d",
          sidebar: "#0d0d10",
          surface: "#111114",
          card: "#16161a",
          accent: "#3D7DFF",
          "accent-hover": "#5c92ff",
          gold: "#e3c483",
          "gold-dim": "#C9A15A",
          success: "#7fd99a",
          destructive: "#ff8080",
          muted: "#b3b3b3",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-sans)",
          "Pretendard",
          "Apple SD Gothic Neo",
          "Noto Sans KR",
          "Malgun Gothic",
          "system-ui",
          "sans-serif",
        ],
        serif: ["var(--font-serif)", "Georgia", "Times New Roman", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
