import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
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

// Rough word-count based reading time estimate from Portable Text blocks
function estimateReadTime(body: any): number {
  if (!Array.isArray(body)) return 1;
  const words = body
    .filter(
      (block) => block?._type === "block" && Array.isArray(block.children),
    )
    .flatMap((block) => block.children.map((c: any) => c.text || ""))
    .join(" ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
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
      <h1 className="scroll-mt-24 text-3xl md:text-4xl font-extrabold text-foreground mt-12 mb-5 tracking-tight">
        {children}
      </h1>
    ),
    h2: ({ children }: any) => (
      <h2 className="scroll-mt-24 text-2xl md:text-3xl font-bold text-foreground mt-12 mb-5 tracking-tight border-b border-border/60 pb-3">
        {children}
      </h2>
    ),
    h3: ({ children }: any) => (
      <h3 className="scroll-mt-24 text-xl md:text-2xl font-semibold text-foreground mt-10 mb-4">
        {children}
      </h3>
    ),
    h4: ({ children }: any) => (
      <h4 className="scroll-mt-24 text-lg md:text-xl font-semibold text-foreground mt-8 mb-3">
        {children}
      </h4>
    ),
    normal: ({ children }: any) => (
      <p className="text-[1.0625rem] text-foreground/80 dark:text-neutral-200 leading-[1.85] mb-6">
        {children}
      </p>
    ),
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-[3px] border-primary pl-6 pr-4 py-1 my-8 italic text-foreground/90 bg-surface-1/40 rounded-r-lg">
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }: any) => (
      <ul className="list-disc pl-6 mb-6 space-y-2.5 text-[1.0625rem] text-foreground/80 dark:text-neutral-200 marker:text-primary/70">
        {children}
      </ul>
    ),
    number: ({ children }: any) => (
      <ol className="list-decimal pl-6 mb-6 space-y-2.5 text-[1.0625rem] text-foreground/80 dark:text-neutral-200 marker:text-primary/70 marker:font-semibold">
        {children}
      </ol>
    ),
  },
  listItem: {
    bullet: ({ children }: any) => (
      <li className="leading-[1.85] pl-1">{children}</li>
    ),
    number: ({ children }: any) => (
      <li className="leading-[1.85] pl-1">{children}</li>
    ),
  },
  marks: {
    strong: ({ children }: any) => (
      <strong className="font-bold text-foreground">{children}</strong>
    ),
    em: ({ children }: any) => <em className="italic">{children}</em>,
    underline: ({ children }: any) => (
      <span className="underline underline-offset-2">{children}</span>
    ),
    code: ({ children }: any) => (
      <code className="bg-surface-2 px-1.5 py-0.5 rounded font-mono text-[0.9em] text-primary">
        {children}
      </code>
    ),
    link: ({ value, children }: any) => {
      const target = (value?.href || "").startsWith("http")
        ? "_blank"
        : undefined;
      return (
        <a
          href={value?.href}
          target={target}
          rel={target === "_blank" ? "noopener noreferrer" : undefined}
          className="text-primary hover:underline underline-offset-2 font-medium decoration-primary/40"
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

  const readTime = estimateReadTime(post.body);

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
    <article className="pt-32 md:pt-40 pb-28 px-6">
      <StructuredData data={articleData} />

      {/* Back link */}
      <div className="max-w-3xl mx-auto mb-8">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground/60 hover:text-primary transition-colors"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to Blog
        </Link>
      </div>

      {/* Header */}
      <header className="max-w-3xl mx-auto mb-14">
        <div className="flex items-center gap-3 text-sm font-medium text-foreground/60 mb-5">
          <time
            dateTime={post.publishedAt}
            className="text-primary font-semibold"
          >
            {formatDate(post.publishedAt)}
          </time>
          <span
            className="w-1 h-1 rounded-full bg-foreground/30"
            aria-hidden="true"
          />
          <span>{readTime} min read</span>
        </div>

        <h1 className="text-4xl md:text-5xl lg:text-[3.25rem] font-bold text-foreground leading-[1.12] tracking-tight mb-6">
          {post.title}
        </h1>

        {post.excerpt && (
          <p className="text-xl text-foreground/65 dark:text-neutral-300 leading-relaxed">
            {post.excerpt}
          </p>
        )}

        {post.author && (
          <div className="mt-8 pt-6 border-t border-border/60 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-sm font-semibold text-primary shrink-0">
              {post.author.name?.charAt(0) ?? "S"}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {post.author.name}
              </p>
              {post.author.bio && (
                <p className="text-xs text-foreground/60">{post.author.bio}</p>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Body */}
      <div className="max-w-3xl mx-auto">
        <div className="prose prose-invert prose-primary max-w-none">
          {post.body && Array.isArray(post.body) ? (
            <PortableText
              value={post.body}
              components={portableTextComponents}
            />
          ) : (
            <p className="text-muted leading-relaxed">No content found.</p>
          )}
        </div>

        {/* Footer / share & back-to-top affordance */}
        <footer className="mt-16 pt-8 border-t border-border/60 flex items-center justify-between">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground/60 hover:text-primary transition-colors"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            More articles
          </Link>
          <p className="text-xs text-foreground/40">
            Thanks for reading — Scryme
          </p>
        </footer>
      </div>
    </article>
  );
}
