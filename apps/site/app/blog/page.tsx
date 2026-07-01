import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Blog — Insights on Retail, CRM, and Inventory Management",
  description:
    "Expert insights and guides on scaling your retail and wholesale business, optimizing CRM workflows, and mastering inventory control.",
  alternates: {
    canonical: "/blog",
  },
};

const posts = [
  {
    title: "How to Scale Your Retail Business from 1 to 10 Locations",
    slug: "scaling-retail-business",
    date: "June 15, 2025",
    excerpt: "Learn the essential strategies for multi-location retail management, from centralized inventory to unified CRM data.",
  },
  {
    title: "The Importance of Offline-First POS in Modern Retail",
    slug: "importance-of-offline-first-pos",
    date: "June 10, 2025",
    excerpt: "Why relying on a constant internet connection for your point of sale is a risk you shouldn't take.",
  },
];

export default function BlogPage() {
  return (
    <main className="pt-32 pb-24 px-6 max-w-5xl mx-auto">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Scryme Blog</h1>
        <p className="text-lg text-muted max-w-2xl mx-auto">
          Insights, guides, and updates from the Scryme team.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="group block p-8 rounded-2xl border border-border bg-surface-1 hover:border-primary/50 transition-all"
          >
            <p className="text-sm text-primary font-semibold mb-3">{post.date}</p>
            <h2 className="text-2xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
              {post.title}
            </h2>
            <p className="text-muted leading-relaxed mb-6">{post.excerpt}</p>
            <div className="flex items-center text-sm font-bold text-primary">
              Read more <ArrowRight className="ml-2 w-4 h-4" />
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
