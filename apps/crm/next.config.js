/** @type {import('next').NextConfig} */
const { withSentryConfig } = require("@sentry/nextjs");

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@repo/ui', '@react-pdf/renderer'],
  output: 'standalone',
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'date-fns', 'recharts', '@repo/ui'],
  },
  async rewrites() {
    const isDev = process.env.NODE_ENV === "development";
    const defaultApiUrl = isDev ? "http://localhost:3002" : "https://api.scryme.tech";
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || defaultApiUrl;

    return [
      {
        source: "/.well-known/:path*",
        destination: `${apiUrl}/.well-known/:path*`,
      },
      {
        source: "/api/auth/ably",
        // Do not forward /api/auth/ably to API backend, instead run locally
        destination: "/api/auth/ably",
      },
      {
        source: "/api/auth/:path*",
        destination: `${apiUrl}/api/auth/:path*`,
      },
    ];
  },
};

module.exports = withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG || "scryme-enterprise",
  project: process.env.SENTRY_PROJECT || "scryme-crm",

  // Source map upload auth token
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Upload wider set of client source files for better stack trace resolution
  widenClientFileUpload: true,

  // Create a proxy API route to bypass ad-blockers
  tunnelRoute: "/monitoring",

  // Suppress non-CI output
  silent: !process.env.CI,
});
