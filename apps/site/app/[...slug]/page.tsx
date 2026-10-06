import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {getCmsPage, getPageMetadata} from "@/lib/sanity";

export const revalidate = 60;

function pathFrom(slug?: string[]) {
  return slug?.join("/") || "";
}

export async function generateMetadata({params}: {params: Promise<{slug?: string[]}>}): Promise<Metadata> {
  const {slug} = await params;
  const path = pathFrom(slug);
  const page = await getCmsPage(path);
  if (!page) return {};
  return getPageMetadata({pageSeo: page.seo, fallbackTitle: page.title, fallbackDescription: page.summary || `Learn how Scryme helps modern businesses with ${page.title.toLowerCase()}.`, canonicalPath: `/${path}`});
}

export default async function CmsPageRoute({params}: {params: Promise<{slug?: string[]}>}) {
  const {slug} = await params;
  const path = pathFrom(slug);
  const page = await getCmsPage(path);
  if (!page) notFound();
  return <main id="main-content" className="container mx-auto py-20 px-4"><h1 className="text-4xl font-bold">{page.title}</h1></main>;
}
