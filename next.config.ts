import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "earthquake.usgs.gov" },
    ],
  },
  transpilePackages: ["react-plotly.js", "plotly.js"],
  async rewrites() {
    // In production (Vercel) Python serverless functions in api/ are served natively by Vercel.
    // The rewrite only applies during local `next dev` to forward to api/dev_server.py.
    if (process.env.NODE_ENV !== "development") {
      return [];
    }
    const apiBase = process.env.API_PROXY_URL ?? "http://localhost:8001";
    return [
      {
        source: "/api/:path*",
        destination: `${apiBase}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
