import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    remotePatterns: [{ hostname: "cms.strelisce-maribor.si" }],
    unoptimized: true,
  },
};

export default nextConfig;
