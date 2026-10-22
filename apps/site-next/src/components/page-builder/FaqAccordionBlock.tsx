import React, { useState } from 'react'
import { ChevronDown, HelpCircle } from 'lucide-react'

export interface FaqItem {
  question: string
  answer: string
}

export interface FaqAccordionBlockProps {
  badge?: string
  title?: string
  subtitle?: string
  faqs?: FaqItem[]
}

export const FaqAccordionBlock: React.FC<FaqAccordionBlockProps> = ({
  badge = 'Frequently Asked Questions',
  title = 'Got Questions? We Have Answers',
  subtitle,
  faqs = [],
}) => {
  const [openIndexes, setOpenIndexes] = useState<number[]>([0])

  const toggleIndex = (idx: number) => {
    setOpenIndexes((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    )
  }

  const faqSchemaData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }

  return (
    <section className="py-20 bg-[var(--bg-main)]">
      {faqs.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchemaData) }}
        />
      )}

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          {badge && (
            <span className="inline-block rounded-full border border-[#d2ff3a]/30 bg-[#d2ff3a]/10 px-3.5 py-1 text-xs font-mono-label text-[#d2ff3a] uppercase tracking-wider mb-4">
              {badge}
            </span>
          )}
          <h2 className="font-serif-headline text-3xl sm:text-4xl font-normal text-[var(--text-main)]">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-4 text-base text-[var(--text-muted)] leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIndexes.includes(idx)
            return (
              <div
                key={idx}
                className="glass-panel rounded-2xl overflow-hidden border border-[var(--card-border)] transition-colors"
              >
                <button
                  type="button"
                  onClick={() => toggleIndex(idx)}
                  className="w-full flex items-center justify-between p-6 text-left focus:outline-none cursor-pointer"
                >
                  <span className="font-semibold text-base sm:text-lg text-[var(--text-main)] pr-4 flex items-center gap-3">
                    <HelpCircle className="h-5 w-5 text-[#d2ff3a] shrink-0" />
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 text-[var(--text-muted)] shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-[#d2ff3a]' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-6 pb-6 pt-2 text-sm sm:text-base text-[var(--text-muted)] leading-relaxed border-t border-white/5">
                    {faq.answer}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
