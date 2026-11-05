import { Link } from '@tanstack/react-router'
import { Layers, Github, Twitter, Linkedin, ShieldCheck } from 'lucide-react'
import { SiteSettings, DEFAULT_SITE_SETTINGS_FALLBACK } from '../sanity/queries'

export interface FooterProps {
  settings?: SiteSettings
}

export function Footer({ settings = DEFAULT_SITE_SETTINGS_FALLBACK }: FooterProps) {
  const columns = settings?.footerColumns && settings.footerColumns.length > 0
    ? settings.footerColumns
    : DEFAULT_SITE_SETTINGS_FALLBACK.footerColumns!

  const socialLinks = settings?.socialLinks && settings.socialLinks.length > 0
    ? settings.socialLinks
    : DEFAULT_SITE_SETTINGS_FALLBACK.socialLinks!

  const copyrightText = settings?.copyrightText || DEFAULT_SITE_SETTINGS_FALLBACK.copyrightText

  return (
    <footer className="bg-[var(--bg-main)] border-t border-white/10 dark:border-white/10 light:border-black/10 pt-16 pb-12 px-4 md:px-8 text-[var(--text-muted)] transition-colors">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-16">

        {/* Brand Column */}
        <div className="lg:col-span-2 space-y-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#d2ff3a] flex items-center justify-center text-[#090a0b] font-black">
              <Layers className="w-4 h-4 stroke-[2.5]" />
            </div>
            <span className="text-xl font-bold tracking-tight dark:text-white light:text-[#090a0b] font-sans">
              SCRYME<span className="text-[#d2ff3a]">.</span>
            </span>
          </Link>
          <p className="text-sm leading-relaxed max-w-sm text-[var(--text-muted)]">
            {settings?.siteDescription || 'The Obsidian Kinetic Autonomous ERP engine. Unifying inventory, RevOps, POS, and CRM with sub-second operational telemetry.'}
          </p>
          <div className="flex items-center gap-3 pt-2">
            {socialLinks.map((s, idx) => {
              const platformLower = s.platform.toLowerCase()
              return (
                <a
                  key={idx}
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={s.platform}
                  className="p-2 rounded-full border border-white/10 dark:border-white/10 light:border-black/10 hover:border-[#d2ff3a] hover:text-[#d2ff3a] transition"
                >
                  {platformLower.includes('git') ? (
                    <Github className="w-4 h-4" />
                  ) : platformLower.includes('twit') || platformLower.includes('x') ? (
                    <Twitter className="w-4 h-4" />
                  ) : (
                    <Linkedin className="w-4 h-4" />
                  )}
                </a>
              )
            })}
          </div>
        </div>

        {/* Dynamic Columns */}
        {columns.map((col, cIdx) => (
          <div key={cIdx}>
            <h4 className="text-xs font-bold uppercase tracking-wider dark:text-white light:text-[#090a0b] font-mono mb-4">
              {col.title}
            </h4>
            <ul className="space-y-2.5 text-sm">
              {col.links.map((link, lIdx) => (
                <li key={lIdx}>
                  {link.href.startsWith('http') ? (
                    <a href={link.href} target="_blank" rel="noreferrer" className="hover:text-[#d2ff3a] transition-colors">
                      {link.label}
                    </a>
                  ) : (
                    <Link to={link.href as any} className="hover:text-[#d2ff3a] transition-colors">
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}

        {/* Compliance Block */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider dark:text-white light:text-[#090a0b] font-mono mb-4">Compliance</h4>
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-white/5 dark:bg-white/5 light:bg-black/5 border border-white/10 dark:border-white/10 light:border-black/10 text-xs">
              <div className="flex items-center gap-1.5 font-bold dark:text-white light:text-[#090a0b] mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#10b981]" />
                <span>SOC2 Type II Certified</span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)]">Encrypted end-to-end with zero-trust network credentials.</p>
            </div>
            <p className="text-xs text-[var(--text-muted)]">{copyrightText}</p>
          </div>
        </div>

      </div>

      <div className="max-w-7xl mx-auto pt-8 border-t border-white/10 dark:border-white/10 light:border-black/10 flex flex-col sm:flex-row items-center justify-between text-xs gap-4">
        <p>Engineered with Obsidian Kinetic UI Standards.</p>
        <div className="flex items-center gap-6">
          <a href="#" className="hover:text-[var(--text-main)] transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-[var(--text-main)] transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-[var(--text-main)] transition-colors">Security Overview</a>
        </div>
      </div>
    </footer>
  )
}
