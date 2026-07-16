/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { StructuredData } from "@/components/seo/structured-data";
import { PortableText } from "@portabletext/react";
import { getPostBySlug, getPosts } from "../../../lib/sanity";
import { colors, fonts } from "@/lib/scryme-tokens";
import { urlFor } from "@/sanity/lib/image";
import { BookText, ArrowRight } from "lucide-react";

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

  const ogImage = post.mainImage
    ? urlFor(post.mainImage).width(1200).height(630).url()
    : "https://scryme.tech/og-image.png";

  return {
    title: `${post.title} — Scryme Blog`,
    description: post.excerpt,
    alternates: {
      canonical: `https://scryme.tech/blog/${slug}`,
    },
    openGraph: {
      type: "article",
      publishedTime: post.publishedAt,
      title: `${post.title} — Scryme Blog`,
      description: post.excerpt,
      url: `https://scryme.tech/blog/${slug}`,
      siteName: "Scryme",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${post.title} — Scryme Blog`,
      description: post.excerpt,
      images: [ogImage],
    },
  };
}

const portableTextComponents = {
  block: {
    h1: ({ children }: any) => (
      <h1
        className="scroll-mt-24 text-2xl sm:text-3xl md:text-4xl font-semibold mt-10 sm:mt-12 mb-4 sm:mb-5 tracking-tight"
        style={{ color: colors.paper, fontFamily: fonts.display }}
      >
        {children}
      </h1>
    ),
    h2: ({ children }: any) => (
      <h2
        className="scroll-mt-24 text-xl sm:text-2xl md:text-3xl font-semibold mt-10 sm:mt-12 mb-4 sm:mb-5 tracking-tight border-b pb-3"
        style={{ color: colors.paper, fontFamily: fonts.display, borderColor: colors.inkLine }}
      >
        {children}
      </h2>
    ),
    h3: ({ children }: any) => (
      <h3
        className="scroll-mt-24 text-lg sm:text-xl md:text-2xl font-semibold mt-8 sm:mt-10 mb-3 sm:mb-4"
        style={{ color: colors.paper, fontFamily: fonts.display }}
      >
        {children}
      </h3>
    ),
    h4: ({ children }: any) => (
      <h4
        className="scroll-mt-24 text-base sm:text-lg md:text-xl font-semibold mt-6 sm:mt-8 mb-2.5 sm:mb-3"
        style={{ color: colors.paper, fontFamily: fonts.display }}
      >
        {children}
      </h4>
    ),
    normal: ({ children }: any) => (
      <p
        className="text-[0.975rem] sm:text-[1.0625rem] leading-[1.8] sm:leading-[1.85] mb-5 sm:mb-6"
        style={{ color: colors.textMuted, fontFamily: fonts.body }}
      >
        {children}
      </p>
    ),
    blockquote: ({ children }: any) => (
      <blockquote
        className="border-l-[3px] pl-5 sm:pl-6 pr-4 py-2 sm:py-3 my-6 sm:my-8 italic rounded-r-lg"
        style={{ borderColor: colors.brass, background: colors.inkPanel, color: colors.paper }}
      >
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }: any) => (
      <ul
        className="list-disc pl-5 sm:pl-6 mb-5 sm:mb-6 space-y-2 sm:space-y-2.5 text-[0.975rem] sm:text-[1.0625rem]"
        style={{ color: colors.textMuted, fontFamily: fonts.body }}
      >
        {children}
      </ul>
    ),
    number: ({ children }: any) => (
      <ol
        className="list-decimal pl-5 sm:pl-6 mb-5 sm:mb-6 space-y-2 sm:space-y-2.5 text-[0.975rem] sm:text-[1.0625rem]"
        style={{ color: colors.textMuted, fontFamily: fonts.body }}
      >
        {children}
      </ol>
    ),
  },
  listItem: {
    bullet: ({ children }: any) => (
      <li className="leading-[1.8] sm:leading-[1.85] pl-0.5 sm:pl-1">{children}</li>
    ),
    number: ({ children }: any) => (
      <li className="leading-[1.8] sm:leading-[1.85] pl-0.5 sm:pl-1">{children}</li>
    ),
  },
  marks: {
    strong: ({ children }: any) => (
      <strong className="font-semibold" style={{ color: colors.paper }}>
        {children}
      </strong>
    ),
    em: ({ children }: any) => <em className="italic">{children}</em>,
    underline: ({ children }: any) => (
      <span className="underline underline-offset-2">{children}</span>
    ),
    code: ({ children }: any) => (
      <code
        className="px-1.5 py-0.5 rounded font-mono text-[0.85em] tracking-tight"
        style={{ background: colors.inkPanel, color: colors.brass }}
      >
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
          className="hover:underline underline-offset-2 font-medium"
          style={{ color: colors.brass }}
        >
          {children}
        </a>
      );
    },
  },
  types: {
    image: ({ value }: any) => {
      if (!value?.asset) return null;
      return (
        <figure
          className="my-6 sm:my-8 rounded-xl overflow-hidden border"
          style={{ borderColor: colors.inkLine }}
        >
          <img
            src={urlFor(value).width(1000).url()}
            alt={value.alt || "Article illustration"}
            className="w-full h-auto max-h-[450px] object-cover"
            loading="lazy"
          />
          {value.caption && (
            <figcaption
              className="px-4 py-2 text-xs sm:text-sm text-center border-t font-medium"
              style={{
                borderColor: colors.inkLine,
                color: colors.textMuted,
                background: colors.inkPanel,
                fontFamily: fonts.body,
              }}
            >
              {value.caption}
            </figcaption>
          )}
        </figure>
      );
    },
  },
};

export default async function BlogPost({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) notFound();

  const readTime = estimateReadTime(post.body);
  const ogImage = post.mainImage
    ? urlFor(post.mainImage).width(1200).height(630).url()
    : "https://scryme.tech/og-image.png";

  const articleData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    datePublished: post.publishedAt,
    image: ogImage,
    description: post.excerpt,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://scryme.tech/blog/${slug}`,
    },
    author: {
      "@type": "Organization",
      name: "Scryme",
    },
    publisher: {
      "@type": "Organization",
      name: "Scryme",
      logo: {
        "@type": "ImageObject",
        url: "https://scryme.tech/logo.png",
      },
    },
  };

  const allPosts = await getPosts();
  const similarPosts = allPosts
    .filter((p) => p.slug.current !== slug)
    .slice(0, 3);

  return (
    <article className="min-h-screen pt-28 md:pt-36 pb-24 px-4 sm:px-6 md:px-8" style={{ background: colors.inkBg }}>
      <StructuredData data={articleData} />

      {/* Back link */}
      <div className="max-w-3xl mx-auto mb-6 sm:mb-8">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold transition-opacity hover:opacity-80"
          style={{ color: colors.brass, fontFamily: fonts.mono }}
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
      <header className="max-w-3xl mx-auto mb-10 sm:mb-12">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm font-medium mb-4">
          <time
            dateTime={post.publishedAt}
            className="font-semibold"
            style={{ color: colors.brass, fontFamily: fonts.mono }}
          >
            {formatDate(post.publishedAt)}
          </time>
          <span
            className="w-1 h-1 rounded-full"
            style={{ background: colors.textFaint }}
            aria-hidden="true"
          />
          <span style={{ color: colors.textMuted, fontFamily: fonts.mono }}>{readTime} min read</span>
        </div>

        <h1
          className="text-2xl sm:text-4xl md:text-5xl font-medium leading-[1.12] tracking-tight mb-5 sm:mb-6 text-balance"
          style={{ color: colors.paper, fontFamily: fonts.display }}
        >
          {post.title}
        </h1>

        {post.excerpt && (
          <p
            className="text-base sm:text-lg md:text-xl leading-relaxed text-pretty"
            style={{ color: colors.textMuted, fontFamily: fonts.body }}
          >
            {post.excerpt}
          </p>
        )}

        {/* Post Main Image */}
        {post.mainImage && (
          <div
            className="mt-8 sm:mt-10 rounded-2xl overflow-hidden border"
            style={{ borderColor: colors.inkLine }}
          >
            <img
              src={urlFor(post.mainImage).width(1000).height(550).url()}
              alt={post.mainImage.alt || post.title}
              className="w-full h-auto max-h-[480px] object-cover"
              loading="eager"
            />
          </div>
        )}

        {post.author && (
          <div
            className="mt-8 pt-6 border-t flex items-center gap-3"
            style={{ borderColor: colors.inkLine }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 border"
              style={{
                background: colors.brassDim,
                borderColor: colors.brassLine,
                color: colors.brass,
                fontFamily: fonts.mono,
              }}
            >
              {post.author.name?.charAt(0) ?? "S"}
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: colors.paper, fontFamily: fonts.body }}>
                {post.author.name}
              </p>
              {post.author.bio && (
                <p className="text-xs" style={{ color: colors.textMuted, fontFamily: fonts.body }}>
                  {post.author.bio}
                </p>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Body */}
      <div className="max-w-3xl mx-auto">
        <div className="prose max-w-none">
          {post.body && Array.isArray(post.body) ? (
            <PortableText
              value={post.body}
              components={portableTextComponents}
            />
          ) : (
            <p className="text-sm leading-relaxed" style={{ color: colors.textMuted, fontFamily: fonts.body }}>
              No content found.
            </p>
          )}
        </div>

        {/* Footer / share & back-to-top affordance */}
        <footer
          className="mt-12 sm:mt-16 pt-6 sm:pt-8 border-t flex items-center justify-between"
          style={{ borderColor: colors.inkLine }}
        >
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold transition-opacity hover:opacity-80"
            style={{ color: colors.brass, fontFamily: fonts.mono }}
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
          <p className="text-xs" style={{ color: colors.textFaint, fontFamily: fonts.body }}>
            Thanks for reading — Scryme
          </p>
        </footer>
      </div>

      {/* Similar Posts Section */}
      <div className="max-w-3xl mx-auto mt-16 md:mt-24 pt-12 border-t" style={{ borderColor: colors.inkLine }}>
        <h3 className="text-xl sm:text-2xl font-medium mb-8" style={{ color: colors.paper, fontFamily: fonts.display }}>
          Similar Articles
        </h3>
        {similarPosts.length === 0 ? (
          <p className="text-sm" style={{ color: colors.textMuted, fontFamily: fonts.body }}>
            No other articles found.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {similarPosts.map((simPost) => (
              <Link
                key={simPost.slug.current}
                href={`/blog/${simPost.slug.current}`}
                className="group flex flex-col rounded-xl border overflow-hidden transition-all duration-300 hover:border-brass/35 hover:-translate-y-1 hover:shadow-lg hover:shadow-brass/5"
                style={{
                  borderColor: colors.inkLine,
                  background: "var(--ink-panel, #121B2E)",
                }}
              >
                {/* Image */}
                {simPost.mainImage ? (
                  <div className="relative h-32 w-full overflow-hidden border-b" style={{ borderColor: colors.inkLine }}>
                    <img
                      src={urlFor(simPost.mainImage).width(400).height(250).url()}
                      alt={simPost.mainImage.alt || simPost.title}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div
                    className="relative h-32 w-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-indigo-950/10 to-slate-900/20 border-b"
                    style={{ borderColor: colors.inkLine }}
                  >
                    <BookText size={24} className="opacity-15" style={{ color: colors.brass }} />
                  </div>
                )}
                {/* Content */}
                <div className="p-4 flex flex-col flex-1">
                  <div className="flex items-center gap-2 mb-1.5 text-[10px] font-medium" style={{ color: colors.textMuted, fontFamily: fonts.mono }}>
                    <span>{formatDate(simPost.publishedAt)}</span>
                  </div>
                  <h4
                    className="text-sm font-semibold mb-2 group-hover:text-brass transition-colors line-clamp-2"
                    style={{ color: colors.paper, fontFamily: fonts.display }}
                  >
                    {simPost.title}
                  </h4>
                  <p className="text-xs leading-relaxed mb-4 line-clamp-2 mt-auto" style={{ color: colors.textMuted, fontFamily: fonts.body }}>
                    {simPost.excerpt || "Read full article..."}
                  </p>
                  <div className="inline-flex items-center text-xs font-semibold mt-auto" style={{ color: colors.brass, fontFamily: fonts.mono }}>
                    Read article
                    <ArrowRight className="ml-1 w-3 h-3 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
