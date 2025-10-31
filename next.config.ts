import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable static export for Firebase Hosting
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  eslint: {
    // Allow production builds to successfully complete even if ESLint errors are present
    ignoreDuringBuilds: true,
  }
};

export default nextConfig;
