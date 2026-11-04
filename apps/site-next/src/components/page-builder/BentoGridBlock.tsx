import { Layers, ShieldCheck, Zap, ArrowRight, Check } from 'lucide-react'

interface BentoCard {
  title?: string
  description?: string
  colSpan?: '1' | '2' | '3'
  badge?: string
  icon?: string
}

interface BentoGridBlockProps {
  badge?: string
  title?: string
  subtitle?: string
  cards?: BentoCard[]
}

export function BentoGridBlock({
  badge = 'Engine Architecture',
  title = 'Engineered for Mission-Critical Operational Throughput',
  subtitle = 'High-frequency telemetry, immutable event meshes, and distributed state coordination out of the box.',
  cards,
}: BentoGridBlockProps) {
  const defaultCards: BentoCard[] = [
    {
      title: 'Sub-Millisecond State Consensus',
      description: 'Distributed operational state synchronizes across retail, logistics, and corporate nodes in under 12ms.',
      colSpan: '2',
      badge: 'Core Kernel',
    },
    {
      title: 'Zero Reconciliation Drift',
      description: 'Atomic dual-entry ledger ensures sales, inventory adjustments, and receivables balance deterministically.',
      colSpan: '1',
      badge: 'Financial Integrity',
    },
    {
      title: 'Decoupled Catalog Engine',
      description: 'Distribute multi-currency pricing, variant rules, and localized inventory allocations globally.',
      colSpan: '1',
      badge: 'Omnichannel',
    },
    {
      title: 'Direct Hardware & Mobile Telemetry',
      description: 'Connect barcode scanners, thermal receipt printers, and Android field units with zero external middleware.',
      colSpan: '2',
      badge: 'Hardware Mesh',
    },
  ]

  const activeCards = cards && cards.length > 0 ? cards : defaultCards

  return (
    <section className="w-full bg-[#f4f3f0] dark:bg-[#0c1015] px-4 py-20 md:px-8 border-t border-[#e2e0dc] dark:border-[#1F293D]">
      <div className="mx-auto flex max-w-7xl flex-col gap-12">
        <div className="flex flex-col gap-3 text-center items-center max-w-3xl mx-auto">
          {badge && (
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#4d6700] dark:text-[#d2ff3a] px-3 py-1 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
              {badge}
            </span>
          )}
          {title && (
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal leading-tight tracking-tight text-[#002116] dark:text-white">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="font-sans text-sm md:text-base leading-relaxed text-[#414844] dark:text-[#8B949E]">
              {subtitle}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {activeCards.map((card, idx) => {
            const spanClass = card.colSpan === '2' ? 'md:col-span-2' : card.colSpan === '3' ? 'md:col-span-3' : 'md:col-span-1'
            return (
              <div
                key={idx}
                className={`flex flex-col justify-between rounded-2xl bg-white dark:bg-[#121824] p-8 border border-black/5 dark:border-[#1F293D] shadow-sm hover:shadow-md transition-shadow ${spanClass}`}
              >
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    {card.badge && (
                      <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[#4d6700] dark:text-[#d2ff3a]">
                        {card.badge}
                      </span>
                    )}
                    <Layers className="h-5 w-5 text-[#414844] dark:text-[#8B949E]" />
                  </div>
                  <h3 className="font-serif text-xl md:text-2xl font-medium text-[#002116] dark:text-white">
                    {card.title}
                  </h3>
                  <p className="font-sans text-sm leading-relaxed text-[#414844] dark:text-[#8B949E]">
                    {card.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
