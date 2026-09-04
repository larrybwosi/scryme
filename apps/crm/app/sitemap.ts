import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://crm.scryme.tech";

  const routes = [
    { url: "", priority: 1.0, changeFrequency: "daily" as const },
    { url: "/dashboard", priority: 0.9, changeFrequency: "daily" as const },
    { url: "/leads", priority: 0.9, changeFrequency: "daily" as const },
    { url: "/customers", priority: 0.9, changeFrequency: "daily" as const },
    { url: "/contacts", priority: 0.8, changeFrequency: "weekly" as const },
    { url: "/companies", priority: 0.8, changeFrequency: "weekly" as const },
    { url: "/pipeline", priority: 0.9, changeFrequency: "daily" as const },
    { url: "/campaigns", priority: 0.8, changeFrequency: "weekly" as const },
    { url: "/campaigns/workflows", priority: 0.7, changeFrequency: "weekly" as const },
    { url: "/campaigns/segments", priority: 0.7, changeFrequency: "weekly" as const },
    { url: "/activities", priority: 0.8, changeFrequency: "daily" as const },
    { url: "/reports", priority: 0.8, changeFrequency: "weekly" as const },
    { url: "/login", priority: 0.6, changeFrequency: "monthly" as const },
    { url: "/sign-up", priority: 0.6, changeFrequency: "monthly" as const },
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route.url}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
