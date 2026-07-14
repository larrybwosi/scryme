import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StructuredData } from "@/components/seo/structured-data";

// This is a placeholder for actual blog post data fetching
const getPost = (slug: string) => {
  const posts: Record<string, any> = {
    "scaling-retail-business": {
      title: "How to Scale Your Retail Business from 1 to 10 Locations",
      description: "Learn the essential strategies for multi-location retail management.",
      date: "2025-06-15",
      content: "Full content would go here...",
    },
    "importance-of-offline-first-pos": {
      title: "The Importance of Offline-First POS in Modern Retail",
      description: "Why relying on a constant internet connection for your point of sale is a risk you shouldn't take.",
      date: "2025-06-10",
      content: "Full content would go here...",
    },
  };
  return posts[slug];
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};

  return {
    title: `${post.title} — Scryme Blog`,
    description: post.description,
    alternates: {
      canonical: `/blog/${slug}`,
    },
    openGraph: {
      type: "article",
      publishedTime: post.date,
      title: post.title,
      description: post.description,
    },
  };
}

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const articleData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    datePublished: post.date,
    author: {
      "@type": "Organization",
      name: "Scryme",
    },
    description: post.description,
  };

  return (
    <article className="pt-40 pb-24 px-6 max-w-3xl mx-auto">
      <StructuredData data={articleData} />
      <header className="mb-12">
        <p className="text-sm font-semibold text-primary mb-4">{post.date}</p>
        <h1 className="text-4xl md:text-5xl font-bold text-foreground leading-tight tracking-tight">
          {post.title}
        </h1>
      </header>
      <div className="prose prose-invert prose-primary max-w-none">
        <p className="text-lg text-muted leading-relaxed">
          {post.description}
        </p>
        {/* Post content */}
        <div className="mt-8 text-foreground/80 leading-relaxed whitespace-pre-wrap">
          {post.content}
        </div>
      </div>
    </article>
  );
}
