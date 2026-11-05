interface LogoItem {
  name: string
  svgCode?: string
  url?: string
}

interface LogoCloudBlockProps {
  badge?: string
  title?: string
  logos?: LogoItem[]
}

export function LogoCloudBlock({
  badge = 'Global Deployment',
  title = 'Powering leading commerce networks & operational nodes',
  logos,
}: LogoCloudBlockProps) {
  const defaultLogos: LogoItem[] = [
    { name: 'Veloce Logistics AG' },
    { name: 'Apex Retail Networks' },
    { name: 'Meridian Supply Systems' },
    { name: 'Kibo Manufacturing' },
    { name: 'Zahara Foods' },
  ]

  const activeLogos = logos && logos.length > 0 ? logos : defaultLogos

  return (
    <section className="w-full bg-white dark:bg-[#090d13] py-14 px-4 md:px-8 border-y border-[#e2e0dc] dark:border-[#1F293D]">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-8 text-center">
        <div className="flex flex-col items-center gap-2">
          {badge && (
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#4d6700] dark:text-[#d2ff3a]">
              {badge}
            </span>
          )}
          {title && (
            <p className="font-sans text-xs md:text-sm uppercase tracking-wider text-[#717974] dark:text-[#8B949E]">
              {title}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 opacity-75 grayscale hover:grayscale-0 transition-all">
          {activeLogos.map((item, idx) => (
            <div
              key={idx}
              className="font-serif text-lg md:text-xl font-bold tracking-tight text-[#002116] dark:text-white px-4 py-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              {item.name}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
