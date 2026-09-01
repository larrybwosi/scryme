import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/_next/",
        "/static/",
        "/banned",
        "/suspended",
        "/forbidden",
      ],
    },
    sitemap: "https://crm.scryme.tech/sitemap.xml",
  };
}
