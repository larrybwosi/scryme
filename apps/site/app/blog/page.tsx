import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getPosts } from "../../lib/sanity";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Blog — Insights on Retail, CRM, and Inventory Management",
  description:
    "Expert insights and guides on scaling your retail and wholesale business, optimizing CRM workflows, and mastering inventory control.",
  alternates: {
    canonical: "/blog",
  },
};

function formatDate(dateString: string) {
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateString;
  }
}

export default async function BlogPage() {
  const posts = await getPosts();

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
            key={post.slug.current}
            href={`/blog/${post.slug.current}`}
            className="group block p-8 rounded-2xl border border-border bg-surface-1 hover:border-primary/50 transition-all"
          >
            <p className="text-sm text-primary font-semibold mb-3">
              {formatDate(post.publishedAt)}
            </p>
            <h2 className="text-2xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
              {post.title}
            </h2>
            <p className="text-muted leading-relaxed mb-6">
              {post.excerpt || "Read full article..."}
            </p>
            <div className="flex items-center text-sm font-bold text-primary">
              Read more <ArrowRight className="ml-2 w-4 h-4" />
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
