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
    // In production (Vercel) the Python functions are served natively —
    // this rewrite only applies during local `next dev`.
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
