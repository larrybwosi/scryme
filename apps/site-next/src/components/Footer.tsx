import { Link } from '@tanstack/react-router'
import { Layers, ArrowRight, Github, Twitter, Linkedin, ShieldCheck } from 'lucide-react'

export function Footer() {
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
            The Obsidian Kinetic Autonomous ERP engine. Unifying inventory, RevOps, POS, and CRM with sub-second operational telemetry.
          </p>
          <div className="flex items-center gap-3 pt-2">
            <a href="https://github.com" target="_blank" rel="noreferrer" aria-label="GitHub" className="p-2 rounded-full border border-white/10 dark:border-white/10 light:border-black/10 hover:border-[#d2ff3a] hover:text-[#d2ff3a] transition">
              <Github className="w-4 h-4" />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noreferrer" aria-label="Twitter" className="p-2 rounded-full border border-white/10 dark:border-white/10 light:border-black/10 hover:border-[#d2ff3a] hover:text-[#d2ff3a] transition">
              <Twitter className="w-4 h-4" />
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noreferrer" aria-label="LinkedIn" className="p-2 rounded-full border border-white/10 dark:border-white/10 light:border-black/10 hover:border-[#d2ff3a] hover:text-[#d2ff3a] transition">
              <Linkedin className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Column 1: Core Modules */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider dark:text-white light:text-[#090a0b] font-mono mb-4">Core Modules</h4>
          <ul className="space-y-2.5 text-sm">
            <li><Link to="/sales" className="hover:text-[#d2ff3a] transition-colors">Sales & RevOps</Link></li>
            <li><Link to="/inventory" className="hover:text-[#d2ff3a] transition-colors">Multi-Location Inventory</Link></li>
            <li><Link to="/crm" className="hover:text-[#d2ff3a] transition-colors">360° Relationship CRM</Link></li>
            <li><Link to="/cms" className="hover:text-[#d2ff3a] transition-colors">Catalog Cloud & CMS</Link></li>
            <li><Link to="/pricing" className="hover:text-[#d2ff3a] transition-colors">Enterprise Pricing</Link></li>
          </ul>
        </div>

        {/* Column 2: Platform & Specs */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider dark:text-white light:text-[#090a0b] font-mono mb-4">Architecture</h4>
          <ul className="space-y-2.5 text-sm">
            <li><a href="#telemetry" className="hover:text-[#d2ff3a] transition-colors">12ms Sync Pipeline</a></li>
            <li><a href="#security" className="hover:text-[#d2ff3a] transition-colors">Hardware-Isolated Edge</a></li>
            <li><a href="#ai" className="hover:text-[#d2ff3a] transition-colors">Hermes Agent AI</a></li>
            <li><Link to="/light" className="hover:text-[#d2ff3a] transition-colors">Light Mode Canvas</Link></li>
            <li><a href="https://app.scryme.tech" className="hover:text-[#d2ff3a] transition-colors">API Docs & OpenAPI</a></li>
          </ul>
        </div>

        {/* Column 3: Trust & Compliance */}
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
            <p className="text-xs text-[var(--text-muted)]">© {new Date().getFullYear()} Scryme Technologies Inc. All rights reserved.</p>
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
