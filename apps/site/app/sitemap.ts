import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://scryme.tech";

  const routes = [
    "",
    "/about",
    "/pricing",
    "/products/crm",
    "/products/pos",
    "/products/inventory",
    "/products/finance",
    "/products/analytics",
    "/blog",
    "/blog/scaling-retail-business",
    "/blog/importance-of-offline-first-pos",
  ];

  return routes.map((route) => {
    let priority = 0.8;
    let changeFrequency: "daily" | "weekly" | "monthly" = "weekly";

    if (route === "") {
      priority = 1.0;
      changeFrequency = "daily";
    } else if (route.startsWith("/products")) {
      priority = 0.9;
      changeFrequency = "weekly";
    } else if (route.startsWith("/blog")) {
      priority = 0.7;
      changeFrequency = "weekly";
    }

    return {
      url: `${baseUrl}${route}`,
      lastModified: new Date(),
      changeFrequency,
      priority,
    };
  });
}
