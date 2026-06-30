import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://scryme.co";

  const routes = [
    "",
    "/about",
    "/pricing",
    "/products/crm",
    "/products/pos",
    "/products/inventory",
    "/products/finance",
    "/blog",
    "/blog/scaling-retail-business",
    "/blog/importance-of-offline-first-pos",
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "daily" : "weekly",
    priority: route === "" ? 1 : 0.8,
  }));
}
