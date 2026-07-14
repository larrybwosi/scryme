/** @type {import('next').NextConfig} */
const { withSentryConfig } = require("@sentry/nextjs");

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@repo/ui', '@react-pdf/renderer'],
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: "/.well-known/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002"}/.well-known/:path*`,
      },
      {
        source: "/api/auth/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002"}/api/auth/:path*`,
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
