import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  experimental: {
    typedRoutes: false,
  },
  webpack: (config) => {
    config.ignoreWarnings = [
      { module: /node_modules\/bcryptjs/ },
    ];
    return config;
  },
};

export default nextConfig;
