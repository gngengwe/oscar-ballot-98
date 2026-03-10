import type { NextConfig } from "next";
import path from "path";
import os from "os";

// Redirect Next.js cache outside OneDrive to avoid file-lock warnings
const cacheDir = path.join(os.tmpdir(), "oscar-ballot-98-next-cache");

const nextConfig: NextConfig = {
  distDir: ".next",
  cacheHandler: undefined,
  cacheMaxMemorySize: 0,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  serverExternalPackages: ["bcryptjs"],
  webpack(config) {
    config.cache = {
      type: "filesystem",
      cacheDirectory: cacheDir,
    };
    return config;
  },
};

export default nextConfig;
