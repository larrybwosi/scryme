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

function estimateReadTime(body: any): number {
  if (!Array.isArray(body)) return 3;
  const words = body
    .filter(
      (block: any) => block?._type === "block" && Array.isArray(block.children),
    )
    .flatMap((block: any) => block.children.map((c: any) => c.text || ""))
    .join(" ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export default async function BlogPage() {
  const posts = await getPosts();
  const [featured, ...rest] = posts;

  return (
    <main className="pt-32 md:pt-40 pb-28 px-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="max-w-2xl mb-16 md:mb-20">
        <p className="text-sm font-semibold text-primary tracking-wide uppercase mb-4">
          The Scryme Blog
        </p>
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-5 tracking-tight leading-[1.1]">
          Insights on Retail, CRM & Inventory
        </h1>
        <p className="text-lg text-foreground/60 leading-relaxed">
          Guides and field notes on scaling your retail and wholesale business,
          streamlining CRM workflows, and mastering inventory control.
        </p>
      </div>

      {posts.length === 0 && (
        <div className="py-24 text-center border border-dashed border-border rounded-2xl">
          <p className="text-foreground/50">No posts yet — check back soon.</p>
        </div>
      )}

      {/* Featured post */}
      {featured && (
        <Link
          href={`/blog/${featured.slug.current}`}
          className="group relative block mb-14 rounded-2xl border border-border bg-surface-1 overflow-hidden hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5"
        >
          <div className="p-8 md:p-12">
            <div className="flex items-center gap-3 mb-5">
              <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full uppercase tracking-wide">
                Latest
              </span>
              <span className="text-sm text-foreground/50 font-medium">
                {formatDate(featured.publishedAt)}
              </span>
              <span
                className="w-1 h-1 rounded-full bg-foreground/30"
                aria-hidden="true"
              />
              <span className="text-sm text-foreground/50 font-medium">
                {estimateReadTime(featured.body)} min read
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4 tracking-tight group-hover:text-primary transition-colors max-w-2xl">
              {featured.title}
            </h2>
            <p className="text-foreground/60 leading-relaxed mb-6 max-w-2xl">
              {featured.excerpt || "Read the full article..."}
            </p>
            <div className="inline-flex items-center text-sm font-bold text-primary">
              Read article
              <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </Link>
      )}

      {/* Post grid */}
      {rest.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rest.map((post) => (
            <Link
              key={post.slug.current}
              href={`/blog/${post.slug.current}`}
              className="group flex flex-col p-7 rounded-2xl border border-border bg-surface-1 hover:border-primary/50 hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="flex items-center gap-2.5 mb-4 text-xs font-medium text-foreground/50">
                <span>{formatDate(post.publishedAt)}</span>
                <span
                  className="w-1 h-1 rounded-full bg-foreground/30"
                  aria-hidden="true"
                />
                <span>{estimateReadTime(post.body)} min read</span>
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3 leading-snug tracking-tight group-hover:text-primary transition-colors">
                {post.title}
              </h3>
              <p className="text-sm text-foreground/60 leading-relaxed mb-6 line-clamp-3">
                {post.excerpt || "Read full article..."}
              </p>
              <div className="mt-auto flex items-center text-sm font-bold text-primary">
                Read more
                <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
