import type { NextConfig } from "next";

// Na GitHub Actions basePath je /src-rata-ta, lokalno prazno
const basePath = process.env.GITHUB_ACTIONS ? "/src-rata-ta" : "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  assetPrefix: basePath,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  images: {
    remotePatterns: [{ hostname: "cms.strelisce-maribor.si" }],
    unoptimized: true,
  },
};

export default nextConfig;
