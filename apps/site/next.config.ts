import type { NextConfig } from "next";

const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;
const isEuPostHog = posthogHost?.includes("eu.i.posthog.com");
const posthogAssetsHost = isEuPostHog
  ? "https://eu-assets.i.posthog.com"
  : "https://us-assets.i.posthog.com";
const posthogIngestHost = posthogHost || "https://us.i.posthog.com";

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

export default nextConfig;
