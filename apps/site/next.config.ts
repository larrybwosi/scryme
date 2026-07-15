import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  output: "standalone",
  skipTrailingSlashRedirect: true,
  images: {
    dangerouslyAllowSVG: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/array/:path*",
        destination: "https://us-assets.i.posthog.com/array/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
    ];
  },
  async redirects() {
    const webUrl = process.env.NEXT_PUBLIC_WEB_URL || "https://app.scryme.tech";
    return [
      {
        source: "/login",
        destination: `${webUrl}/login`,
        permanent: false,
      },
      {
        source: "/signup",
        destination: `${webUrl}/sign-up`,
        permanent: false,
      },
      {
        source: "/sign-up",
        destination: `${webUrl}/sign-up`,
        permanent: false,
      },
      {
        source: "/contact",
        destination: `${webUrl}/sign-up`,
        permanent: false,
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG || "scryme-enterprise",
  project: process.env.SENTRY_PROJECT || "scryme-site",

  // Source map upload auth token
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Upload wider set of client source files for better stack trace resolution
  widenClientFileUpload: true,

  // Create a proxy API route to bypass ad-blockers
  tunnelRoute: "/monitoring",

  // Suppress non-CI output
  silent: !process.env.CI,
});
