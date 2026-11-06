import type { NextConfig } from "next";

function getValidApiUrl(envUrl: string | undefined, defaultUrl: string): string {
  if (!envUrl || typeof envUrl !== "string") return defaultUrl;
  if (envUrl.includes("PLACEHOLDER")) return defaultUrl;
  if (!envUrl.startsWith("http://") && !envUrl.startsWith("https://")) return defaultUrl;
  return envUrl;
}

const nextConfig: NextConfig = {
  transpilePackages: ["@repo/ui", "@repo/shared", "@repo/auth", "@repo/db", "@repo/env"],
  output: "standalone",
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  async rewrites() {
    const isDev = process.env.NODE_ENV === "development";
    const defaultApiUrl = isDev
      ? "http://localhost:3002"
      : "https://api.scryme.tech";
    const apiUrl = getValidApiUrl(process.env.NEXT_PUBLIC_API_URL, defaultApiUrl);

    return [
      {
        source: "/.well-known/:path*",
        destination: `${apiUrl}/.well-known/:path*`,
      },
    ];
  },
};

export default nextConfig;
