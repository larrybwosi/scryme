/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  transpilePackages: ["@repo/ui", "@react-pdf/renderer", "@repo/documents", "@repo/shared", "@repo/db"],
  serverExternalPackages: ["@prisma/client", "pg"],
  output: "standalone",
};
