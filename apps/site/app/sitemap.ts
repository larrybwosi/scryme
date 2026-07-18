import type { MetadataRoute } from "next";
import { getPosts } from "../lib/sanity";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://scryme.tech";

  const staticRoutes = [
    "",
    "/about",
    "/pricing",
    "/products/crm",
    "/products/pos",
    "/products/inventory",
    "/products/finance",
    "/products/analytics",
    "/blog",
  ];

  // Dynamically fetch all blog posts to generate correct dynamic URLs
  let posts: any[] = [];
  try {
    posts = await getPosts();
  } catch (err) {
    console.error("Failed to fetch posts for sitemap, falling back to empty:", err);
  }

  const dynamicBlogRoutes = posts.map((post) => `/blog/${post.slug.current}`);
  const allRoutes = [...staticRoutes, ...dynamicBlogRoutes];

  // Remove potential duplicates
  const uniqueRoutes = Array.from(new Set(allRoutes));

  return uniqueRoutes.map((route) => {
    let priority = 0.8;
    let changeFrequency: "daily" | "weekly" | "monthly" = "weekly";

    if (route === "") {
      priority = 1.0;
      changeFrequency = "daily";
    } else if (route.startsWith("/products")) {
      priority = 0.9;
      changeFrequency = "weekly";
    } else if (route.startsWith("/blog/")) {
      priority = 0.7;
      changeFrequency = "weekly";
    } else if (route === "/blog") {
      priority = 0.8;
      changeFrequency = "daily";
    }

    // Attempt to map precise lastModified date based on post publish date
    let lastModified = new Date();
    if (route.startsWith("/blog/")) {
      const slug = route.substring("/blog/".length);
      const post = posts.find((p) => p.slug.current === slug);
      if (post && post.publishedAt) {
        try {
          lastModified = new Date(post.publishedAt);
        } catch {
          // fallback to current date
        }
      }
    }

    return {
      url: `${baseUrl}${route}`,
      lastModified,
      changeFrequency,
      priority,
    };
  });
}
