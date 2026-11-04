import { ArrowRight, CheckCircle2 } from 'lucide-react'

interface WorkflowStep {
  stepNumber?: string
  title: string
  description?: string
  icon?: string
}

interface WorkflowStepsBlockProps {
  badge?: string
  title?: string
  subtitle?: string
  steps?: WorkflowStep[]
}

export function WorkflowStepsBlock({
  badge = 'Execution Flow',
  title = 'Deploy and scale in 3 deterministic steps',
  subtitle = 'Zero disruption to ongoing store checkouts and warehouse operations.',
  steps,
}: WorkflowStepsBlockProps) {
  const defaultSteps: WorkflowStep[] = [
    {
      stepNumber: '01',
      title: 'Catalog & Ledger Ingestion',
      description: 'Stream current product hierarchies, multi-branch inventories, and historical ledgers through zero-data-loss connectors.',
    },
    {
      stepNumber: '02',
      title: 'Distributed Node Provisioning',
      description: 'Activate local POS terminals, mobile handhelds, and branch warehouses with cryptographic tenant isolation.',
    },
    {
      stepNumber: '03',
      title: 'Full Autonomous Consensus',
      description: 'Shift operational traffic to Scryme kernel with sub-12ms event synchronization and automated tax compliance.',
    },
  ]

  const activeSteps = steps && steps.length > 0 ? steps : defaultSteps

  return (
    <section className="w-full bg-[#f4f3f0] dark:bg-[#0c1015] px-4 py-20 md:px-8">
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {activeSteps.map((step, idx) => (
            <div
              key={idx}
              className="relative flex flex-col justify-between rounded-2xl bg-white dark:bg-[#121824] p-8 border border-black/5 dark:border-[#1F293D] shadow-sm"
            >
              <div className="flex flex-col gap-4">
                <span className="font-mono text-2xl font-bold text-[#4d6700] dark:text-[#d2ff3a]">
                  {step.stepNumber || `0${idx + 1}`}
                </span>
                <h3 className="font-serif text-xl font-medium text-[#002116] dark:text-white">
                  {step.title}
                </h3>
                <p className="font-sans text-sm leading-relaxed text-[#414844] dark:text-[#8B949E]">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
