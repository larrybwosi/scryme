import type { NextConfig } from "next";

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

export default nextConfig;
