/** @type {import('next').NextConfig} */
module.exports = {
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
