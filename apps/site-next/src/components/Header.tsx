import { Link, useRouterState } from '@tanstack/react-router'
import { ArrowRight, Layers, Sun, Moon, Menu, X, Code2 } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useState, useEffect } from 'react'

const NAV_ITEMS = [
  { to: '/', label: 'Platform' },
  { to: '/crm', label: 'CRM' },
  { to: '/cms', label: 'Catalog Cloud' },
  { to: '/payments', label: 'Payments' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/developers/apps', label: 'Developers', mobileLabel: 'Developers (Auth Clients)', icon: Code2 },
] as const

const LOGIN_URL = 'https://app.scryme.tech/login'
const SIGNUP_URL = 'https://app.scryme.tech/signup?plan=free'

const linkBase =
  'relative transition-colors hover:text-[var(--nav-hover)] [&.active]:text-[#d2ff3a] [&.active]:font-bold'

export function Header() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  useEffect(() => setMounted(true), [])

  // Elevate header after scrolling
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close menu on route change
  useEffect(() => setMobileMenuOpen(false), [pathname])

  // Escape to close + lock body scroll while open
  useEffect(() => {
    if (!mobileMenuOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMobileMenuOpen(false)
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [mobileMenuOpen])

  const isDark = resolvedTheme === 'dark'

  return (
    <header
      className={`sticky top-0 z-50 backdrop-blur-xl bg-[var(--header-bg)] border-b px-4 md:px-8 py-3.5 transition-all duration-300 ${
        scrolled
          ? 'border-white/15 dark:border-white/15 light:border-black/15 shadow-lg shadow-black/10'
          : 'border-white/10 dark:border-white/10 light:border-black/10'
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group" aria-label="Scryme home">
          <div className="w-9 h-9 rounded-lg bg-[#d2ff3a] flex items-center justify-center text-[#090a0b] transition-transform duration-200 group-hover:scale-105 group-hover:-rotate-3 shadow-sm">
            <Layers className="w-5 h-5 stroke-[2.5]" />
          </div>
          <span className="text-xl font-bold tracking-tight font-sans dark:text-white light:text-[#090a0b]">
            SCRYME<span className="text-[#d2ff3a]">.</span>
          </span>
        </Link>

        {/* Desktop navigation */}
        <nav aria-label="Primary" className="hidden lg:flex items-center gap-1 text-sm font-medium text-[var(--nav-text)]">
          {NAV_ITEMS.map(({ to, label, ...rest }) => {
            const Icon = 'icon' in rest ? rest.icon : null
            return (
              <Link
                key={to}
                to={to}
                activeOptions={{ exact: to === '/' }}
                className={`${linkBase} px-3.5 py-2 rounded-full hover:bg-white/5 dark:hover:bg-white/5 light:hover:bg-black/5 flex items-center gap-1.5`}
              >
                {Icon && <Icon className="w-3.5 h-3.5 text-[#d2ff3a]" />}
                <span>{label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2.5">
          {mounted ? (
            <button
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
              className="p-2 rounded-full border border-white/10 dark:border-white/15 light:border-black/15 text-[var(--text-main)] hover:bg-white/10 dark:hover:bg-white/10 light:hover:bg-black/5 transition focus-visible:outline-2 focus-visible:outline-[#d2ff3a]"
            >
              {isDark ? <Sun className="w-4 h-4 text-[#d2ff3a]" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>
          ) : (
            <span className="w-8 h-8" aria-hidden /> // avoids layout shift before hydration
          )}

          <a
            href={LOGIN_URL}
            className="hidden sm:inline-flex px-4 py-2 text-xs font-semibold uppercase tracking-wider dark:text-[#e3e2e3] light:text-[#121314] border border-white/15 light:border-black/15 rounded-full hover:bg-white/10 dark:hover:bg-white/10 light:hover:bg-black/5 transition"
          >
            Sign In
          </a>
          <a
            href={SIGNUP_URL}
            className="group/cta inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold uppercase tracking-wider text-[#090a0b] bg-[#d2ff3a] rounded-full hover:bg-[#c7f32c] hover:shadow-[0_0_20px_rgba(210,255,58,0.4)] transition-all active:scale-95"
          >
            <span>Get Started</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/cta:translate-x-0.5" />
          </a>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileMenuOpen((o) => !o)}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav"
            className="lg:hidden p-2 rounded-lg text-[var(--text-main)] hover:bg-white/10 transition"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 top-full h-screen bg-black/50 backdrop-blur-sm z-40"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden
          />
          <div
            id="mobile-nav"
            className="lg:hidden absolute inset-x-0 top-full bg-[var(--bg-main)] border-b border-white/10 dark:border-white/10 light:border-black/10 p-6 shadow-2xl flex flex-col gap-4 max-h-[calc(100vh-4rem)] overflow-y-auto animate-in slide-in-from-top duration-200 z-50"
          >
            <nav aria-label="Mobile" className="flex flex-col text-base font-medium text-[var(--nav-text)]">
              {NAV_ITEMS.map(({ to, label, ...rest }) => {
                const Icon = 'icon' in rest ? rest.icon : null
                const text = 'mobileLabel' in rest ? rest.mobileLabel : label
                return (
                  <Link
                    key={to}
                    to={to}
                    activeOptions={{ exact: to === '/' }}
                    className={`${linkBase} py-3 border-b border-white/5 dark:border-white/5 light:border-black/5 last:border-0 flex items-center gap-2`}
                  >
                    {Icon && <Icon className="w-4 h-4 text-[#d2ff3a]" />}
                    <span>{text}</span>
                  </Link>
                )
              })}
            </nav>

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <a
                href={LOGIN_URL}
                className="text-center py-2.5 text-xs font-semibold uppercase tracking-wider dark:text-[#e3e2e3] light:text-[#121314] border border-white/15 light:border-black/15 rounded-full hover:bg-white/5 transition flex-1"
              >
                Sign In
              </a>
              <a
                href={SIGNUP_URL}
                className="text-center py-2.5 text-xs font-bold uppercase tracking-wider text-[#090a0b] bg-[#d2ff3a] rounded-full hover:bg-[#c7f32c] transition flex-1"
              >
                Get Started
              </a>
            </div>
          </div>
        </>
      )}
    </header>
  )
}