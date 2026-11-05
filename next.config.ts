import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/src-rata-ta",
  assetPrefix: "/src-rata-ta",
  images: {
    remotePatterns: [{ hostname: "cms.strelisce-maribor.si" }],
    unoptimized: true,
  },
};

export default nextConfig;
