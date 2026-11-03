import { Link, useRouterState } from '@tanstack/react-router'
import {
  ArrowRight,
  Layers,
  Sun,
  Moon,
  Menu,
  X,
  ChevronDown,
  Store,
  Users,
  Database,
  Box,
  MapPin,
  Bot,
  Smartphone,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { useState, useEffect, useRef, useCallback, useId } from 'react'

export interface FeatureItem {
  to: string
  label: string
  description?: string
  icon: React.ComponentType<{ className?: string }>
}

const FEATURE_ITEMS: FeatureItem[] = [
  {
    to: '/point-of-sale',
    label: 'POS',
    description: 'Sub-second checkout & hardware integration',
    icon: Store,
  },
  {
    to: '/crm',
    label: 'CRM',
    description: '360° customer relationship & pipeline ledger',
    icon: Users,
  },
  {
    to: '/cms',
    label: 'CMS',
    description: 'Catalog Cloud & omnichannel content mesh',
    icon: Database,
  },
  {
    to: '/inventory',
    label: 'Inventory',
    description: 'Multi-branch stock sync & automated reordering',
    icon: Box,
  },
  {
    to: '/locations',
    label: 'Locations',
    description: 'Distributed warehouse topology & edge mesh',
    icon: MapPin,
  },
  {
    to: '/mcp-agent-apis',
    label: 'MCP & API',
    description: 'Deterministic AI agents & Model Context Protocol',
    icon: Bot,
  },
  {
    to: '/mobile-field-ops',
    label: 'Mobile',
    description: 'Offline-first field operations & barcode scans',
    icon: Smartphone,
  },
]

const LOGIN_URL = 'https://app.scryme.tech/login'
const SIGNUP_URL = 'https://app.scryme.tech/signup?plan=free'

const ACCENT = '#d2ff3a'

/* Shared styles ----------------------------------------------------------- */

const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d2ff3a]'

const hoverSurface =
  'hover:bg-white/5 dark:hover:bg-white/5 light:hover:bg-black/5'

// Desktop link with an animated underline that scales in when active
const navLink = [
  'relative px-3.5 py-2 rounded-full text-sm font-medium text-[var(--nav-text)]',
  'transition-colors hover:text-[var(--nav-hover)]',
  hoverSurface,
  focusRing,
  'after:absolute after:inset-x-4 after:-bottom-0.5 after:h-0.5 after:rounded-full',
  `after:bg-[${ACCENT}] after:origin-center after:scale-x-0 after:transition-transform after:duration-200`,
  '[&.active]:text-[#d2ff3a] [&.active]:font-bold [&.active]:after:scale-x-100',
].join(' ')

const mobileLink = [
  'flex items-center justify-between py-3.5 text-base font-medium text-[var(--nav-text)]',
  'border-b border-white/5 dark:border-white/5 light:border-black/5',
  'transition-colors hover:text-[var(--nav-hover)]',
  focusRing,
  '[&.active]:text-[#d2ff3a] [&.active]:font-bold',
].join(' ')

const ghostButton = [
  'inline-flex items-center justify-center px-4 py-2 text-xs font-semibold uppercase tracking-wider',
  'dark:text-[#e3e2e3] light:text-[#121314]',
  'border border-white/15 light:border-black/15 rounded-full',
  'hover:bg-white/10 dark:hover:bg-white/10 light:hover:bg-black/5 transition',
  focusRing,
].join(' ')

const primaryButton = [
  'group/cta inline-flex items-center justify-center gap-1.5 px-5 py-2 text-xs font-bold uppercase tracking-wider',
  'text-[#090a0b] bg-[#d2ff3a] rounded-full',
  'hover:bg-[#c7f32c] hover:shadow-[0_0_24px_rgba(210,255,58,0.45)]',
  'transition-all active:scale-95',
  focusRing,
].join(' ')

/* Component --------------------------------------------------------------- */

export function Header() {
  const { resolvedTheme, setTheme } = useTheme()
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  const [mounted, setMounted] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mobileFeaturesExpanded, setMobileFeaturesExpanded] = useState(true)
  const [featuresOpen, setFeaturesOpen] = useState(false)

  const dropdownRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([])
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const menuId = useId()

  const isDark = resolvedTheme === 'dark'
  const isFeatureActive = FEATURE_ITEMS.some((item) => pathname === item.to)

  useEffect(() => setMounted(true), [])

  /* Elevate header after scrolling */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  /* Close menus on route change */
  useEffect(() => {
    setMobileMenuOpen(false)
    setFeaturesOpen(false)
  }, [pathname])

  /* Hover-intent helpers: a short close delay stops the menu flickering
     when the pointer crosses the gap between trigger and panel. */
  const openFeatures = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setFeaturesOpen(true)
  }, [])

  const scheduleClose = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    closeTimer.current = setTimeout(() => setFeaturesOpen(false), 120)
  }, [])

  useEffect(() => () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
  }, [])

  /* Click outside + Escape for the desktop dropdown */
  useEffect(() => {
    if (!featuresOpen) return
    const onPointer = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setFeaturesOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setFeaturesOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [featuresOpen])

  /* Escape to close + lock body scroll while mobile drawer is open */
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

  /* Keyboard navigation inside the features menu */
  const focusItem = (index: number) => {
    const count = FEATURE_ITEMS.length
    itemRefs.current[(index + count) % count]?.focus()
  }

  const onTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setFeaturesOpen(true)
      requestAnimationFrame(() => focusItem(0))
    }
  }

  const onMenuKeyDown = (e: React.KeyboardEvent) => {
    const current = itemRefs.current.findIndex((el) => el === document.activeElement)
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        focusItem(current + 1)
        break
      case 'ArrowUp':
        e.preventDefault()
        focusItem(current - 1)
        break
      case 'Home':
        e.preventDefault()
        focusItem(0)
        break
      case 'End':
        e.preventDefault()
        focusItem(FEATURE_ITEMS.length - 1)
        break
    }
  }

  return (
    <header
      className={`sticky top-0 z-50 backdrop-blur-xl bg-[var(--header-bg)] border-b px-4 md:px-8 transition-all duration-300 ${
        scrolled
          ? 'py-2.5 border-white/15 dark:border-white/15 light:border-black/15 shadow-lg shadow-black/10'
          : 'py-3.5 border-white/10 dark:border-white/10 light:border-black/10'
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Logo */}
        <Link
          to="/"
          className={`flex items-center gap-2.5 group rounded-lg ${focusRing}`}
          aria-label="Scryme home"
        >
          <div className="w-9 h-9 rounded-lg bg-[#d2ff3a] flex items-center justify-center text-[#090a0b] shadow-sm transition-all duration-200 group-hover:scale-105 group-hover:-rotate-3 group-hover:shadow-[0_0_18px_rgba(210,255,58,0.45)]">
            <Layers className="w-5 h-5 stroke-[2.5]" />
          </div>
          <span className="text-xl font-bold tracking-tight font-sans dark:text-white light:text-[#090a0b]">
            SCRYME<span className="text-[#d2ff3a]">.</span>
          </span>
        </Link>

        {/* Desktop navigation */}
        <nav aria-label="Primary" className="hidden lg:flex items-center gap-1">
          <Link to="/" activeOptions={{ exact: true }} className={navLink}>
            Platform
          </Link>

          {/* Features mega-menu */}
          <div
            ref={dropdownRef}
            className="relative"
            onMouseEnter={openFeatures}
            onMouseLeave={scheduleClose}
            onBlur={(e) => {
              if (!dropdownRef.current?.contains(e.relatedTarget as Node)) setFeaturesOpen(false)
            }}
          >
            <button
              ref={triggerRef}
              type="button"
              onClick={() => setFeaturesOpen((o) => !o)}
              onKeyDown={onTriggerKeyDown}
              aria-expanded={featuresOpen}
              aria-haspopup="menu"
              aria-controls={menuId}
              className={`${navLink} inline-flex items-center gap-1 cursor-pointer ${
                isFeatureActive || featuresOpen ? 'text-[#d2ff3a]' : ''
              } ${isFeatureActive ? 'font-bold after:scale-x-100' : ''}`}
            >
              <span>Features</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  featuresOpen ? 'rotate-180' : 'opacity-70'
                }`}
              />
            </button>

            {featuresOpen && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 pt-3 w-[40rem] z-50">
                <div
                  id={menuId}
                  role="menu"
                  aria-label="Features"
                  onKeyDown={onMenuKeyDown}
                  className="rounded-2xl border border-white/15 dark:border-white/15 light:border-black/15 bg-[var(--header-bg)] backdrop-blur-2xl shadow-2xl shadow-black/30 overflow-hidden animate-in fade-in-50 zoom-in-95 slide-in-from-top-1 duration-150 motion-reduce:animate-none"
                >
                  <div className="grid grid-cols-2 gap-1 p-2.5">
                    {FEATURE_ITEMS.map((item, i) => {
                      const Icon = item.icon
                      const active = pathname === item.to
                      return (
                        <Link
                          key={item.to}
                          ref={(el) => {
                            itemRefs.current[i] = el
                          }}
                          to={item.to as any}
                          role="menuitem"
                          className={`group flex items-start gap-3 p-3 rounded-xl transition-all ${focusRing} ${
                            active
                              ? 'bg-white/10 dark:bg-white/10 light:bg-black/10'
                              : `${hoverSurface} focus-visible:bg-white/5`
                          }`}
                        >
                          <div
                            className={`mt-0.5 p-2 rounded-lg transition-all duration-200 ${
                              active
                                ? 'bg-[#d2ff3a] text-[#090a0b]'
                                : 'bg-white/5 dark:bg-white/5 light:bg-black/5 text-[var(--text-muted)] group-hover:bg-[#d2ff3a] group-hover:text-[#090a0b] group-hover:scale-105'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex flex-col gap-0.5 min-w-0">
                            <span
                              className={`text-sm font-semibold tracking-tight transition-colors ${
                                active
                                  ? 'text-[#d2ff3a]'
                                  : 'text-[var(--text-main)] group-hover:text-[#d2ff3a]'
                              }`}
                            >
                              {item.label}
                            </span>
                            {item.description && (
                              <span className="text-xs leading-snug text-[var(--text-muted)] line-clamp-2">
                                {item.description}
                              </span>
                            )}
                          </div>
                        </Link>
                      )
                    })}

                    {/* Fills the 8th grid cell so the layout stays balanced */}
                    <a
                      href={SIGNUP_URL}
                      role="menuitem"
                      className={`group flex flex-col justify-center gap-1 p-3 rounded-xl border border-dashed border-[#d2ff3a]/40 bg-[#d2ff3a]/5 hover:bg-[#d2ff3a]/10 transition ${focusRing}`}
                    >
                      <span className="text-sm font-semibold text-[#d2ff3a] flex items-center gap-1.5">
                        Start on the free plan
                        <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                      </span>
                      <span className="text-xs text-[var(--text-muted)]">
                        Every module, one connected platform.
                      </span>
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Link to="/payments" className={navLink}>
            Payments
          </Link>
          <Link to="/pricing" className={navLink}>
            Pricing
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2.5">
          {mounted ? (
            <button
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
              className={`relative p-2 rounded-full border border-white/10 dark:border-white/15 light:border-black/15 text-[var(--text-main)] hover:bg-white/10 dark:hover:bg-white/10 light:hover:bg-black/5 transition ${focusRing}`}
            >
              <span className="relative block w-4 h-4">
                <Sun
                  className={`absolute inset-0 w-4 h-4 text-[#d2ff3a] transition-all duration-300 motion-reduce:transition-none ${
                    isDark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-50 opacity-0'
                  }`}
                />
                <Moon
                  className={`absolute inset-0 w-4 h-4 text-slate-700 transition-all duration-300 motion-reduce:transition-none ${
                    isDark ? 'rotate-90 scale-50 opacity-0' : 'rotate-0 scale-100 opacity-100'
                  }`}
                />
              </span>
            </button>
          ) : (
            <span className="w-8 h-8" aria-hidden />
          )}

          <a href={LOGIN_URL} className={`hidden sm:inline-flex ${ghostButton}`}>
            Sign In
          </a>
          <a href={SIGNUP_URL} className={`hidden sm:inline-flex ${primaryButton}`}>
            <span>Get Started</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/cta:translate-x-0.5" />
          </a>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileMenuOpen((o) => !o)}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav"
            className={`lg:hidden p-2 rounded-lg text-[var(--text-main)] hover:bg-white/10 transition ${focusRing}`}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 top-full h-screen bg-black/50 backdrop-blur-sm z-40 animate-in fade-in duration-200"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden
          />
          <div
            id="mobile-nav"
            className="lg:hidden absolute inset-x-0 top-full bg-[var(--bg-main)] border-b border-white/10 dark:border-white/10 light:border-black/10 px-6 pt-2 pb-6 shadow-2xl flex flex-col gap-5 max-h-[calc(100vh-4rem)] overflow-y-auto overscroll-contain animate-in slide-in-from-top duration-200 motion-reduce:animate-none z-50"
          >
            <nav aria-label="Mobile" className="flex flex-col">
              <Link to="/" activeOptions={{ exact: true }} className={mobileLink}>
                Platform
              </Link>

              {/* Features group */}
              <div className="border-b border-white/5 dark:border-white/5 light:border-black/5">
                <button
                  type="button"
                  onClick={() => setMobileFeaturesExpanded((p) => !p)}
                  aria-expanded={mobileFeaturesExpanded}
                  aria-controls="mobile-features"
                  className={`w-full flex items-center justify-between py-3.5 text-base font-medium cursor-pointer transition-colors ${focusRing} ${
                    isFeatureActive
                      ? 'text-[#d2ff3a] font-bold'
                      : 'text-[var(--nav-text)] hover:text-[var(--nav-hover)]'
                  }`}
                >
                  <span>Features</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${
                      mobileFeaturesExpanded ? 'rotate-180 text-[#d2ff3a]' : 'opacity-70'
                    }`}
                  />
                </button>

                {mobileFeaturesExpanded && (
                  <div id="mobile-features" className="grid grid-cols-1 sm:grid-cols-2 gap-1 pb-3">
                    {FEATURE_ITEMS.map((item) => {
                      const Icon = item.icon
                      const active = pathname === item.to
                      return (
                        <Link
                          key={item.to}
                          to={item.to as any}
                          className={`flex items-center gap-3 p-2.5 rounded-xl transition-all ${focusRing} ${
                            active
                              ? 'bg-white/10 dark:bg-white/10 light:bg-black/10'
                              : hoverSurface
                          }`}
                        >
                          <div
                            className={`p-2 rounded-lg shrink-0 ${
                              active
                                ? 'bg-[#d2ff3a] text-[#090a0b]'
                                : 'bg-white/5 dark:bg-white/5 light:bg-black/5 text-[var(--text-muted)]'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span
                              className={`text-sm font-semibold ${
                                active ? 'text-[#d2ff3a]' : 'text-[var(--text-main)]'
                              }`}
                            >
                              {item.label}
                            </span>
                            {item.description && (
                              <span className="text-xs text-[var(--text-muted)] line-clamp-1">
                                {item.description}
                              </span>
                            )}
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>

              <Link to="/payments" className={mobileLink}>
                Payments
              </Link>
              <Link to="/pricing" className={`${mobileLink} border-b-0`}>
                Pricing
              </Link>
            </nav>

            <div className="flex flex-col sm:flex-row gap-3">
              <a href={LOGIN_URL} className={`${ghostButton} flex-1 py-3`}>
                Sign In
              </a>
              <a href={SIGNUP_URL} className={`${primaryButton} flex-1 py-3`}>
                <span>Get Started</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/cta:translate-x-0.5" />
              </a>
            </div>
          </div>
        </>
      )}
    </header>
  )
}