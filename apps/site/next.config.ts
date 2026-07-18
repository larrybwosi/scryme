import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;
const isEuPostHog = posthogHost?.includes("eu.i.posthog.com");
const posthogAssetsHost = isEuPostHog
  ? "https://eu-assets.i.posthog.com"
  : "https://us-assets.i.posthog.com";
const posthogIngestHost = posthogHost || "https://us.i.posthog.com";

const nextConfig: NextConfig = {
  output: "standalone",
  skipTrailingSlashRedirect: true,
  experimental: {
    webpackMemoryOptimizations: true,
  },
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
        destination: `${posthogAssetsHost}/static/:path*`,
      },
      {
        source: "/ingest/array/:path*",
        destination: `${posthogAssetsHost}/array/:path*`,
      },
      {
        source: "/ingest/:path*",
        destination: `${posthogIngestHost}/:path*`,
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

  // Disable Sentry sourcemaps generation and upload during local build to reduce resources
  sourcemaps: {
    disable: true,
  },

  // Bundle size optimizations to exclude heavy features from the build
  bundleSizeOptimizations: {
    excludeDebugStatements: true,
    excludeTracing: true,
  },
});
