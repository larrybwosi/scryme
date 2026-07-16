/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  transpilePackages: ["@repo/ui", "@react-pdf/renderer"],
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
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || defaultApiUrl;

    return [
      {
        source: "/.well-known/:path*",
        destination: `${apiUrl}/.well-known/:path*`,
      },
    ];
  },
};
