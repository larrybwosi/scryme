import { Link } from '@tanstack/react-router'
import { ArrowRight, Layers, Sun, Moon, Menu, X, Code2 } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useState, useEffect } from 'react'

export function Header() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-[var(--header-bg)] border-b border-white/10 dark:border-white/10 light:border-black/10 px-4 md:px-8 py-4 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-lg bg-[#d2ff3a] flex items-center justify-center text-[#090a0b] font-black tracking-wider transition-transform group-hover:scale-105 shadow-sm">
            <Layers className="w-5 h-5 stroke-[2.5]" />
          </div>
          <span className="text-xl font-bold tracking-tight font-sans dark:text-white light:text-[#090a0b]">
            SCRYME<span className="text-[#d2ff3a]">.</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-[var(--nav-text)]">
          <Link to="/" className="hover:text-[var(--nav-hover)] transition-colors [&.active]:text-[#d2ff3a] [&.active]:font-bold">Platform</Link>
          <Link to="/inventory" className="hover:text-[var(--nav-hover)] transition-colors [&.active]:text-[#d2ff3a] [&.active]:font-bold">Inventory</Link>
          <Link to="/sales" className="hover:text-[var(--nav-hover)] transition-colors [&.active]:text-[#d2ff3a] [&.active]:font-bold">Sales & RevOps</Link>
          <Link to="/crm" className="hover:text-[var(--nav-hover)] transition-colors [&.active]:text-[#d2ff3a] [&.active]:font-bold">CRM</Link>
          <Link to="/cms" className="hover:text-[var(--nav-hover)] transition-colors [&.active]:text-[#d2ff3a] [&.active]:font-bold">Catalog Cloud</Link>
          <Link to="/pricing" className="hover:text-[var(--nav-hover)] transition-colors [&.active]:text-[#d2ff3a] [&.active]:font-bold">Pricing</Link>
          <Link to="/developers/apps" className="hover:text-[var(--nav-hover)] transition-colors [&.active]:text-[#d2ff3a] [&.active]:font-bold flex items-center gap-1.5">
            <Code2 className="w-3.5 h-3.5 text-[#d2ff3a]" />
            <span>Developers</span>
          </Link>
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {/* Theme Switcher Toggle */}
          {mounted && (
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label="Toggle theme"
              className="p-2 rounded-full border border-white/10 dark:border-white/15 light:border-black/15 text-[var(--text-main)] hover:bg-white/10 dark:hover:bg-white/10 light:hover:bg-black/5 transition"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-[#d2ff3a]" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>
          )}

          <a
            href="https://app.scryme.tech/login"
            className="hidden sm:inline-flex px-4 py-2 text-xs font-semibold uppercase tracking-wider dark:text-[#e3e2e3] light:text-[#121314] hover:text-white border border-white/15 light:border-black/15 rounded-full hover:bg-white/10 transition"
          >
            Sign In
          </a>
          <a
            href="https://app.scryme.tech/signup"
            className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold uppercase tracking-wider text-[#090a0b] bg-[#d2ff3a] rounded-full hover:bg-[#c7f32c] hover:shadow-[0_0_20px_rgba(210,255,58,0.4)] transition-all transform active:scale-95"
          >
            <span>Get Started</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Open navigation menu"
            className="lg:hidden p-2 rounded-lg text-[var(--text-main)] hover:bg-white/10 transition"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-x-0 top-[73px] bg-[var(--bg-main)] border-b border-white/10 dark:border-white/10 light:border-black/10 p-6 shadow-2xl flex flex-col gap-4 animate-in slide-in-from-top duration-200">
          <nav className="flex flex-col gap-3 text-base font-medium text-[var(--nav-text)]">
            <Link onClick={() => setMobileMenuOpen(false)} to="/" className="py-2 hover:text-[var(--nav-hover)] transition-colors [&.active]:text-[#d2ff3a] [&.active]:font-bold">Platform</Link>
            <Link onClick={() => setMobileMenuOpen(false)} to="/inventory" className="py-2 hover:text-[var(--nav-hover)] transition-colors [&.active]:text-[#d2ff3a] [&.active]:font-bold">Inventory</Link>
            <Link onClick={() => setMobileMenuOpen(false)} to="/sales" className="py-2 hover:text-[var(--nav-hover)] transition-colors [&.active]:text-[#d2ff3a] [&.active]:font-bold">Sales & RevOps</Link>
            <Link onClick={() => setMobileMenuOpen(false)} to="/crm" className="py-2 hover:text-[var(--nav-hover)] transition-colors [&.active]:text-[#d2ff3a] [&.active]:font-bold">CRM</Link>
            <Link onClick={() => setMobileMenuOpen(false)} to="/cms" className="py-2 hover:text-[var(--nav-hover)] transition-colors [&.active]:text-[#d2ff3a] [&.active]:font-bold">Catalog Cloud</Link>
            <Link onClick={() => setMobileMenuOpen(false)} to="/pricing" className="py-2 hover:text-[var(--nav-hover)] transition-colors [&.active]:text-[#d2ff3a] [&.active]:font-bold">Pricing</Link>
            <Link onClick={() => setMobileMenuOpen(false)} to="/developers/apps" className="py-2 hover:text-[var(--nav-hover)] transition-colors [&.active]:text-[#d2ff3a] [&.active]:font-bold flex items-center gap-2">
              <Code2 className="w-4 h-4 text-[#d2ff3a]" />
              <span>Developers (Auth Clients)</span>
            </Link>
          </nav>
          <div className="pt-4 border-t border-white/10 flex flex-col gap-3">
            <a
              href="https://app.scryme.tech/login"
              className="text-center py-2.5 text-xs font-semibold uppercase tracking-wider dark:text-[#e3e2e3] light:text-[#121314] border border-white/15 rounded-full hover:bg-white/5 transition"
            >
              Sign In
            </a>
          </div>
        </div>
      )}
    </header>
  )
}
