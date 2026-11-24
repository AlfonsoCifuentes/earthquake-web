import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "earthquake.usgs.gov" },
    ],
  },
  transpilePackages: ["react-plotly.js", "plotly.js"],
};

export default nextConfig;
