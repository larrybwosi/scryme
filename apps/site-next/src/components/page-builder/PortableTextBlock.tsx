import React from 'react'
import { PortableText } from '@portabletext/react'
import { urlFor } from '../../sanity/image'

export interface PortableTextBlockProps {
  title?: string
  content?: any
}

const portableTextComponents = {
  types: {
    image: ({ value }: any) => {
      const imgUrl = value ? urlFor(value)?.width(1000).url() : null
      if (!imgUrl) return null
      return (
        <figure className="my-8 overflow-hidden rounded-2xl border border-[var(--card-border)]">
          <img src={imgUrl} alt={value.alt || 'Article image'} className="w-full object-cover" />
          {value.caption && (
            <figcaption className="p-3 text-center text-xs text-[var(--text-muted)] bg-white/5 font-mono-label">
              {value.caption}
            </figcaption>
          )}
        </figure>
      )
    },
  },
  block: {
    h2: ({ children }: any) => (
      <h2 className="font-serif-headline text-2xl sm:text-3xl font-normal text-[var(--text-main)] mt-10 mb-4">
        {children}
      </h2>
    ),
    h3: ({ children }: any) => (
      <h3 className="font-serif-headline text-xl sm:text-2xl font-normal text-[var(--text-main)] mt-8 mb-3">
        {children}
      </h3>
    ),
    h4: ({ children }: any) => (
      <h4 className="font-bold text-lg text-[var(--text-main)] mt-6 mb-2">
        {children}
      </h4>
    ),
    blockquote: ({ children }: any) => (
      <blockquote className="my-6 border-l-4 border-[#d2ff3a] pl-4 py-1 italic text-[var(--text-muted)] text-lg bg-[#d2ff3a]/5 rounded-r-lg">
        {children}
      </blockquote>
    ),
    normal: ({ children }: any) => (
      <p className="text-base sm:text-lg text-[var(--text-muted)] leading-relaxed mb-4">
        {children}
      </p>
    ),
  },
  list: {
    bullet: ({ children }: any) => (
      <ul className="list-disc list-inside space-y-2 text-[var(--text-muted)] my-4 pl-4">
        {children}
      </ul>
    ),
    number: ({ children }: any) => (
      <ol className="list-decimal list-inside space-y-2 text-[var(--text-muted)] my-4 pl-4">
        {children}
      </ol>
    ),
  },
  marks: {
    link: ({ value, children }: any) => (
      <a
        href={value?.href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[#d2ff3a] underline underline-offset-4 hover:opacity-80 transition-opacity"
      >
        {children}
      </a>
    ),
    strong: ({ children }: any) => (
      <strong className="font-semibold text-[var(--text-main)]">{children}</strong>
    ),
  },
}

export const PortableTextBlock: React.FC<PortableTextBlockProps> = ({
  title,
  content,
}) => {
  if (!content) return null

  return (
    <section className="py-16 bg-[var(--bg-main)]">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {title && (
          <h2 className="font-serif-headline text-3xl sm:text-4xl font-normal text-[var(--text-main)] mb-8">
            {title}
          </h2>
        )}
        <div className="prose prose-invert max-w-none">
          <PortableText value={content} components={portableTextComponents} />
        </div>
      </div>
    </section>
  )
}
