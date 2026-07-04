import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@repo/ui", "@repo/db"],
  serverExternalPackages: ["@prisma/client", "pg"],
};

export default nextConfig;
