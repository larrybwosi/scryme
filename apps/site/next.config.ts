import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    dangerouslyAllowSVG: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
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
