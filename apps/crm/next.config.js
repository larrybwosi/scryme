/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  transpilePackages: ['@repo/ui', '@react-pdf/renderer'],
  output: 'standalone',
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
