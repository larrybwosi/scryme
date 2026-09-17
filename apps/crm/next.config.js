/** @type {import('next').NextConfig} */
function getValidApiUrl(envUrl, defaultUrl) {
  if (!envUrl || typeof envUrl !== "string") return defaultUrl;
  if (envUrl.includes("PLACEHOLDER")) return defaultUrl;
  if (!envUrl.startsWith("http://") && !envUrl.startsWith("https://")) return defaultUrl;
  return envUrl;
}

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@repo/ui", "@react-pdf/renderer", "@repo/documents", "@repo/shared"],
  output: "standalone",
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? { exclude: ["error", "warn"] }
        : false,
  },
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "date-fns",
      "recharts",
      "@repo/ui",
    ],
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
  images: {
    dangerouslyAllowSVG: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.dicebear.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "3001",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
