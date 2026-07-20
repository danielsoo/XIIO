import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep the development cache separate from production builds. Running
  // `next build` while the local preview is open must not invalidate the
  // preview's CSS and JavaScript chunks.
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
};

export default nextConfig;
