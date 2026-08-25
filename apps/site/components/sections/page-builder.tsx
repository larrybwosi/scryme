import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { urlFor } from "@/sanity/lib/image";

export type CmsLink = { label?: string; href?: string; style?: "primary" | "secondary" | "text" };
type CmsImage = { asset?: unknown; alt?: string; caption?: string };
type Section = { _key: string; _type: string; hidden?: boolean; eyebrow?: string; heading?: string; body?: string; image?: CmsImage; primaryCta?: CmsLink; secondaryCta?: CmsLink; cta?: CmsLink; imagePosition?: "left" | "right"; items?: any[] };

function Action({link}: {link?: CmsLink}) {
  if (!link?.label || !link.href) return null;
  const className = link.style === "primary"
    ? "inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-primary transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
    : link.style === "text"
      ? "inline-flex min-h-12 items-center gap-2 font-semibold text-foreground underline-offset-4 hover:underline"
      : "inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-border bg-background px-6 py-3 font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring";
  return <Link href={link.href} className={className}>{link.label}<ArrowRight aria-hidden="true" className="size-4" /></Link>;
}

function Header({eyebrow, heading, body, centered = false}: {eyebrow?: string; heading?: string; body?: string; centered?: boolean}) {
  return <div className={`flex max-w-3xl flex-col gap-4 ${centered ? "mx-auto items-center text-center" : ""}`}>
    {eyebrow && <p className="font-mono text-sm font-semibold uppercase tracking-[0.16em] text-primary">{eyebrow}</p>}
    {heading && <h2 className="text-balance text-3xl font-semibold tracking-tight text-foreground md:text-5xl">{heading}</h2>}
    {body && <p className="text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">{body}</p>}
  </div>;
}

function CmsImage({image, priority = false}: {image?: CmsImage; priority?: boolean}) {
  if (!image?.asset) return <div className="flex aspect-[4/3] items-center justify-center rounded-2xl border border-border bg-muted font-mono text-sm text-muted-foreground">Add a premium image in Sanity</div>;
  return <figure className="flex flex-col gap-3">
    <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border bg-muted shadow-xl">
      <Image src={urlFor(image).width(1400).height(1050).quality(90).url()} alt={image.alt || ""} fill priority={priority} sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
    </div>
    {image.caption && <figcaption className="text-sm text-muted-foreground">{image.caption}</figcaption>}
  </figure>;
}

function Hero({section}: {section: Section}) {
  return <section className="relative overflow-hidden border-b border-border pt-28 md:pt-36">
    <div className={`container flex gap-12 pb-20 md:pb-28 ${section.image ? "flex-col lg:flex-row lg:items-center" : "flex-col items-center text-center"}`}>
      <div className="flex flex-1 flex-col gap-8">
        {section.eyebrow && <p className="font-mono text-sm font-semibold uppercase tracking-[0.16em] text-primary">{section.eyebrow}</p>}
        <div className="flex flex-col gap-5">
          <h1 className="text-balance text-5xl font-semibold tracking-[-0.045em] text-foreground md:text-7xl">{section.heading}</h1>
          {section.body && <p className="max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground md:text-xl">{section.body}</p>}
        </div>
        <div className="flex flex-wrap gap-3"><Action link={section.primaryCta} /><Action link={section.secondaryCta} /></div>
      </div>
      {section.image && <div className="w-full flex-1"><CmsImage image={section.image} priority /></div>}
    </div>
  </section>;
}

function Features({section}: {section: Section}) {
  return <section className="py-20 md:py-28"><div className="container flex flex-col gap-12"><Header eyebrow={section.eyebrow} heading={section.heading} body={section.body} />
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{section.items?.map((item) => <article key={item._key} className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-6 shadow-sm">
      {item.image?.asset && <div className="relative aspect-video overflow-hidden rounded-xl bg-muted"><Image src={urlFor(item.image).width(800).height(450).url()} alt={item.image.alt || ""} fill sizes="(min-width: 1024px) 30vw, 100vw" className="object-cover" /></div>}
      <div className="flex flex-col gap-2"><h3 className="text-xl font-semibold text-card-foreground">{item.title}</h3><p className="leading-relaxed text-muted-foreground">{item.description}</p></div><Action link={item.link} />
    </article>)}</div></div></section>;
}

function Media({section}: {section: Section}) {
  const imageFirst = section.imagePosition === "left";
  return <section className="border-y border-border bg-muted py-20 md:py-28"><div className="container grid items-center gap-12 lg:grid-cols-2"><div className={imageFirst ? "lg:order-2" : ""}><Header eyebrow={section.eyebrow} heading={section.heading} body={section.body} /><div className="mt-8"><Action link={section.cta} /></div></div><div className={imageFirst ? "lg:order-1" : ""}><CmsImage image={section.image} /></div></div></section>;
}

function Metrics({section}: {section: Section}) {
  return <section className="py-20"><div className="container flex flex-col gap-10"><Header heading={section.heading} centered /><div className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">{section.items?.map((item) => <div key={item._key} className="flex flex-col gap-2 bg-card p-7"><strong className="text-4xl tracking-tight text-primary">{item.value}</strong><span className="font-semibold text-card-foreground">{item.label}</span>{item.detail && <span className="text-sm text-muted-foreground">{item.detail}</span>}</div>)}</div></div></section>;
}

function Testimonials({section}: {section: Section}) {
  return <section className="bg-foreground py-20 text-background md:py-28"><div className="container flex flex-col gap-12"><div className="max-w-3xl"><p className="font-mono text-sm uppercase tracking-[0.16em] text-primary">{section.eyebrow}</p><h2 className="mt-4 text-balance text-3xl font-semibold md:text-5xl">{section.heading}</h2></div><div className="grid gap-5 lg:grid-cols-3">{section.items?.map((item) => <figure key={item._key} className="flex flex-col justify-between gap-8 rounded-2xl border border-background/15 bg-background/5 p-7"><blockquote className="text-pretty text-lg leading-relaxed">“{item.quote}”</blockquote><figcaption className="flex flex-col gap-1"><strong>{item.name}</strong><span className="text-sm text-background/65">{[item.role, item.company].filter(Boolean).join(" · ")}</span></figcaption></figure>)}</div></div></section>;
}

function Faq({section}: {section: Section}) {
  return <section className="py-20 md:py-28"><div className="container grid gap-12 lg:grid-cols-[0.75fr_1.25fr]"><Header eyebrow={section.eyebrow} heading={section.heading} body={section.body} /><div className="flex flex-col gap-3">{section.items?.map((item) => <details key={item._key} className="group rounded-xl border border-border bg-card p-5"><summary className="cursor-pointer list-none pr-8 font-semibold text-card-foreground marker:hidden">{item.question}</summary><p className="pt-4 leading-relaxed text-muted-foreground">{item.answer}</p></details>)}</div></div></section>;
}

function Cta({section}: {section: Section}) {
  return <section className="py-16 md:py-24"><div className="container"><div className="flex flex-col items-start gap-8 rounded-3xl bg-primary p-8 text-primary-foreground shadow-primary md:p-14 lg:flex-row lg:items-end lg:justify-between"><div className="flex max-w-3xl flex-col gap-4">{section.eyebrow && <p className="font-mono text-sm uppercase tracking-[0.16em] opacity-75">{section.eyebrow}</p>}<h2 className="text-balance text-3xl font-semibold tracking-tight md:text-5xl">{section.heading}</h2><p className="max-w-2xl text-pretty text-lg leading-relaxed opacity-80">{section.body}</p></div><div className="flex shrink-0 flex-wrap gap-3"><Link href={section.primaryCta?.href || "/demo"} className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-background px-6 py-3 font-semibold text-foreground">{section.primaryCta?.label || "Book a demo"}<ArrowRight className="size-4" /></Link></div></div></div></section>;
}

export function PageBuilder({sections}: {sections?: Section[]}) {
  if (!sections?.length) return null;
  return <>{sections.filter((section) => !section.hidden).map((section) => {
    switch (section._type) {
      case "heroSection": return <Hero key={section._key} section={section} />;
      case "featureSection": return <Features key={section._key} section={section} />;
      case "mediaSection": return <Media key={section._key} section={section} />;
      case "metricsSection": return <Metrics key={section._key} section={section} />;
      case "testimonialSection": return <Testimonials key={section._key} section={section} />;
      case "faqSection": return <Faq key={section._key} section={section} />;
      case "ctaSection": return <Cta key={section._key} section={section} />;
      default: return null;
    }
  })}</>;
}
