import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* /gospel is "The Door" — a separate Vite app deployed as its own Vercel project.
     It is proxied in rather than rebuilt here so it keeps its own build, its own canvas
     renderer and its own deploy cadence. It is built with base "/gospel/" and emits into
     dist/gospel, so the path is identical on both hosts and assets resolve either way. */
  async rewrites() {
    return [
      { source: "/gospel", destination: "https://the-door-nine.vercel.app/gospel" },
      { source: "/gospel/:path*", destination: "https://the-door-nine.vercel.app/gospel/:path*" },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.convex.cloud",
      },
    ],
  },
};

export default nextConfig;
