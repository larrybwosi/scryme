/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookText } from "lucide-react";
import { getPosts } from "../../lib/sanity";
import { colors, fonts } from "@/lib/scryme-tokens";
import { urlFor } from "@/sanity/lib/image";
import Image from "next/image";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Blog — Insights on Retail, CRM, and Inventory Management",
  description:
    "Expert insights and guides on scaling your retail and wholesale business, optimizing CRM workflows, and mastering inventory control.",
  alternates: {
    canonical: "https://scryme.tech/blog",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://scryme.tech/blog",
    title: "Blog — Insights on Retail, CRM, and Inventory Management | Scryme",
    description:
      "Expert insights and guides on scaling your retail and wholesale business, optimizing CRM workflows, and mastering inventory control.",
    siteName: "Scryme",
    images: [
      {
        url: "https://scryme.tech/og-image.png",
        width: 1200,
        height: 630,
        alt: "The Scryme Blog — Insights on Retail, CRM & Inventory",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog — Insights on Retail, CRM, and Inventory Management | Scryme",
    description:
      "Expert insights and guides on scaling your retail and wholesale business, optimizing CRM workflows, and mastering inventory control.",
    creator: "@scryme",
    images: ["https://scryme.tech/og-image.png"],
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
    <main className="min-h-screen pt-28 md:pt-36 pb-24 px-4 sm:px-6 md:px-8" style={{ background: colors.inkBg }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="max-w-2xl mb-12 md:mb-16">
          <p
            className="text-xs md:text-sm font-semibold tracking-widest uppercase mb-3 md:mb-4"
            style={{ color: colors.brass, fontFamily: fonts.mono }}
          >
            The Scryme Blog
          </p>
          <h1
            className="text-3xl sm:text-4xl md:text-5xl font-medium mb-4 tracking-tight leading-[1.1]"
            style={{ color: colors.paper, fontFamily: fonts.display }}
          >
            Insights on Retail, CRM & Inventory
          </h1>
          <p
            className="text-base md:text-lg leading-relaxed"
            style={{ color: colors.textMuted, fontFamily: fonts.body }}
          >
            Guides and field notes on scaling your retail and wholesale business,
            streamlining CRM workflows, and mastering inventory control.
          </p>
        </div>

        {posts.length === 0 && (
          <div
            className="py-16 md:py-24 text-center border rounded-2xl"
            style={{ borderColor: colors.inkLine, background: colors.inkPanel }}
          >
            <p className="text-sm" style={{ color: colors.textMuted, fontFamily: fonts.body }}>
              No posts yet — check back soon.
            </p>
          </div>
        )}

        {/* Featured post */}
        {featured && (
          <Link
            href={`/blog/${featured.slug.current}`}
            className="group relative block mb-12 md:mb-16 rounded-2xl border overflow-hidden transition-all duration-300 hover:border-brass/35 hover:shadow-2xl hover:shadow-brass/5"
            style={{
              borderColor: colors.inkLine,
              background: colors.inkPanel,
            }}
          >
            <div className="flex flex-col lg:flex-row items-stretch">
              {/* Image Section */}
              {featured.mainImage && (
                <div className="w-full lg:w-1/2 relative min-h-[220px] sm:min-h-[300px] lg:min-h-[400px] overflow-hidden">
                  <Image
                    src={featured.mainImage.url || urlFor(featured.mainImage).width(800).height(500).url()}
                    alt={featured.mainImage.alt || featured.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-slate-950/40 via-transparent to-transparent opacity-60 pointer-events-none" />
                </div>
              )}
              {!featured.mainImage && (
                <div
                  className="w-full lg:w-1/2 relative min-h-[180px] lg:min-h-[400px] overflow-hidden flex items-center justify-center bg-gradient-to-br from-indigo-950/20 to-slate-900/30 border-b lg:border-b-0 lg:border-r"
                  style={{ borderColor: colors.inkLine }}
                >
                  <div
                    className="absolute inset-0 opacity-[0.04] pointer-events-none"
                    style={{
                      backgroundImage: `linear-gradient(${colors.textPrimary} 1px, transparent 1px)`,
                      backgroundSize: "100% 20px",
                    }}
                  />
                  <BookText size={48} className="opacity-15" style={{ color: colors.brass }} />
                </div>
              )}

              {/* Text Section */}
              <div className="flex-1 p-6 sm:p-8 md:p-10 lg:p-12 flex flex-col justify-center">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4 md:mb-5">
                  <span
                    className="text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider"
                    style={{
                      color: colors.brass,
                      background: colors.brassDim,
                      fontFamily: fonts.mono,
                    }}
                  >
                    Latest
                  </span>
                  <span
                    className="text-xs font-medium"
                    style={{ color: colors.textMuted, fontFamily: fonts.mono }}
                  >
                    {formatDate(featured.publishedAt)}
                  </span>
                  <span
                    className="w-1 h-1 rounded-full"
                    style={{ background: colors.textFaint }}
                    aria-hidden="true"
                  />
                  <span
                    className="text-xs font-medium"
                    style={{ color: colors.textMuted, fontFamily: fonts.mono }}
                  >
                    {estimateReadTime(featured.body)} min read
                  </span>
                </div>
                <h2
                  className="text-xl sm:text-2xl md:text-3xl font-medium mb-3 md:mb-4 tracking-tight group-hover:text-brass transition-colors leading-tight"
                  style={{ color: colors.paper, fontFamily: fonts.display }}
                >
                  {featured.title}
                </h2>
                <p
                  className="text-sm md:text-base leading-relaxed mb-6"
                  style={{ color: colors.textMuted, fontFamily: fonts.body }}
                >
                  {featured.excerpt || "Read the full article..."}
                </p>
                <div
                  className="inline-flex items-center text-xs md:text-sm font-semibold transition-colors group-hover:opacity-85 mt-auto"
                  style={{ color: colors.brass, fontFamily: fonts.mono }}
                >
                  Read article
                  <ArrowRight className="ml-1.5 w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </div>
          </Link>
        )}

        {/* Post grid */}
        {rest.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {rest.map((post) => (
              <Link
                key={post.slug.current}
                href={`/blog/${post.slug.current}`}
                className="group flex flex-col rounded-2xl border overflow-hidden transition-all duration-300 hover:border-brass/35 hover:-translate-y-1 hover:shadow-xl hover:shadow-brass/5"
                style={{
                  borderColor: colors.inkLine,
                  background: colors.inkPanel,
                }}
              >
                {/* Post Card Image */}
                {post.mainImage && (
                  <div
                    className="relative h-44 sm:h-48 w-full overflow-hidden border-b"
                    style={{ borderColor: colors.inkLine }}
                  >
                    <Image
                      src={post.mainImage.url || urlFor(post.mainImage).width(600).height(400).url()}
                      alt={post.mainImage.alt || post.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      loading="lazy"
                    />
                  </div>
                )}
                {!post.mainImage && (
                  <div
                    className="relative h-44 sm:h-48 w-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-indigo-950/10 to-slate-900/20 border-b"
                    style={{ borderColor: colors.inkLine }}
                  >
                    <div
                      className="absolute inset-0 opacity-[0.02] pointer-events-none"
                      style={{
                        backgroundImage: `linear-gradient(${colors.textPrimary} 1px, transparent 1px)`,
                        backgroundSize: "100% 20px",
                      }}
                    />
                    <BookText size={32} className="opacity-15" style={{ color: colors.brass }} />
                  </div>
                )}

                <div className="p-6 md:p-7 flex flex-col flex-1">
                  <div
                    className="flex items-center gap-2 mb-3.5 text-xs font-medium"
                    style={{ color: colors.textMuted, fontFamily: fonts.mono }}
                  >
                    <span>{formatDate(post.publishedAt)}</span>
                    <span
                      className="w-1 h-1 rounded-full"
                      style={{ background: colors.textFaint }}
                      aria-hidden="true"
                    />
                    <span>{estimateReadTime(post.body)} min read</span>
                  </div>
                  <h3
                    className="text-lg md:text-xl font-medium mb-3 leading-snug tracking-tight group-hover:text-brass transition-colors line-clamp-2"
                    style={{ color: colors.paper, fontFamily: fonts.display }}
                  >
                    {post.title}
                  </h3>
                  <p
                    className="text-sm leading-relaxed mb-5 line-clamp-3"
                    style={{ color: colors.textMuted, fontFamily: fonts.body }}
                  >
                    {post.excerpt || "Read full article..."}
                  </p>
                  <div
                    className="mt-auto inline-flex items-center text-xs font-semibold"
                    style={{ color: colors.brass, fontFamily: fonts.mono }}
                  >
                    Read more
                    <ArrowRight className="ml-1.5 w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
