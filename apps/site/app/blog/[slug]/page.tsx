import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StructuredData } from "@/components/seo/structured-data";
import { PortableText } from "@portabletext/react";
import { getPostBySlug } from "../../../lib/sanity";

export const dynamic = "force-dynamic";

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

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) return {};

  return {
    title: `${post.title} — Scryme Blog`,
    description: post.excerpt,
    alternates: {
      canonical: `/blog/${slug}`,
    },
    openGraph: {
      type: "article",
      publishedTime: post.publishedAt,
      title: post.title,
      description: post.excerpt,
    },
  };
}

const portableTextComponents = {
  block: {
    h1: ({ children }: any) => (
      <h1 className="text-3xl md:text-4xl font-extrabold text-foreground mt-8 mb-4">
        {children}
      </h1>
    ),
    h2: ({ children }: any) => (
      <h2 className="text-2xl md:text-3xl font-bold text-foreground mt-8 mb-4">
        {children}
      </h2>
    ),
    h3: ({ children }: any) => (
      <h3 className="text-xl md:text-2xl font-semibold text-foreground mt-6 mb-3">
        {children}
      </h3>
    ),
    h4: ({ children }: any) => (
      <h4 className="text-lg md:text-xl font-semibold text-foreground mt-6 mb-2">
        {children}
      </h4>
    ),
    normal: ({ children }: any) => (
      <p className="text-foreground/80 dark:text-neutral-200 leading-relaxed mb-6">
        {children}
      </p>
    ),
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-4 border-primary pl-6 my-6 italic text-foreground/90 bg-surface-1/40 p-4 rounded-r-lg">
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }: any) => (
      <ul className="list-disc pl-6 mb-6 space-y-2 text-foreground/80 dark:text-neutral-200">
        {children}
      </ul>
    ),
    number: ({ children }: any) => (
      <ol className="list-decimal pl-6 mb-6 space-y-2 text-foreground/80 dark:text-neutral-200">
        {children}
      </ol>
    ),
  },
  listItem: {
    bullet: ({ children }: any) => <li className="leading-relaxed">{children}</li>,
    number: ({ children }: any) => <li className="leading-relaxed">{children}</li>,
  },
  marks: {
    strong: ({ children }: any) => (
      <strong className="font-bold text-foreground">{children}</strong>
    ),
    em: ({ children }: any) => <em className="italic">{children}</em>,
    underline: ({ children }: any) => <span className="underline">{children}</span>,
    code: ({ children }: any) => (
      <code className="bg-surface-2 px-1.5 py-0.5 rounded font-mono text-sm text-primary">
        {children}
      </code>
    ),
    link: ({ value, children }: any) => {
      const target = (value?.href || "").startsWith("http") ? "_blank" : undefined;
      return (
        <a
          href={value?.href}
          target={target}
          rel={target === "_blank" ? "noopener noreferrer" : undefined}
          className="text-primary hover:underline font-medium"
        >
          {children}
        </a>
      );
    },
  },
};

export default async function BlogPost({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) notFound();

  const articleData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    datePublished: post.publishedAt,
    author: {
      "@type": "Organization",
      name: "Scryme",
    },
    description: post.excerpt,
  };

  return (
    <article className="pt-40 pb-24 px-6 max-w-3xl mx-auto">
      <StructuredData data={articleData} />
      <header className="mb-12">
        <p className="text-sm font-semibold text-primary mb-4">
          {formatDate(post.publishedAt)}
        </p>
        <h1 className="text-4xl md:text-5xl font-bold text-foreground leading-tight tracking-tight">
          {post.title}
        </h1>
        {post.author && (
          <div className="mt-4 flex items-center gap-3">
            <div>
              <p className="text-sm font-medium text-foreground">{post.author.name}</p>
              {post.author.bio && (
                <p className="text-xs text-foreground/70">{post.author.bio}</p>
              )}
            </div>
          </div>
        )}
      </header>
      <div className="prose prose-invert prose-primary max-w-none">
        {post.excerpt && (
          <p className="text-lg text-foreground/80 dark:text-neutral-200 leading-relaxed italic mb-8">
            {post.excerpt}
          </p>
        )}
        <div className="mt-8 text-foreground/90 leading-relaxed">
          {post.body && Array.isArray(post.body) ? (
            <PortableText value={post.body} components={portableTextComponents} />
          ) : (
            <p className="text-muted leading-relaxed">No content found.</p>
          )}
        </div>
      </div>
    </article>
  );
}
