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
import { SiteSettings, DEFAULT_SITE_SETTINGS_FALLBACK } from '../sanity/queries'
import { trackOpenPanelEvent } from '../lib/openpanel'

export interface HeaderProps {
  settings?: SiteSettings
}

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

/* Shared styles ----------------------------------------------------------- */

// NOTE: Tailwind only generates classes it can find as *complete literal strings*,
// so never build class names with template interpolation (e.g. `bg-[${COLOR}]`).

const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d2ff3a]'

const hoverSurface =
  'hover:bg-white/5 dark:hover:bg-white/5 light:hover:bg-black/5'

// Horizontal gutter that also respects notches / rounded corners in landscape
const gutter =
  'pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] ' +
  'md:pl-[max(2rem,env(safe-area-inset-left))] md:pr-[max(2rem,env(safe-area-inset-right))]'

// Desktop link with an animated underline that scales in when active
const navLink = [
  'relative px-3.5 py-2 rounded-full text-sm font-medium whitespace-nowrap text-[var(--nav-text)]',
  'transition-colors hover:text-[var(--nav-hover)]',
  hoverSurface,
  focusRing,
  'after:absolute after:inset-x-4 after:-bottom-0.5 after:h-0.5 after:rounded-full',
  'after:bg-[#d2ff3a] after:origin-center after:scale-x-0 after:transition-transform after:duration-200',
  '[&.active]:text-[#d2ff3a] [&.active]:font-bold [&.active]:after:scale-x-100',
].join(' ')

const mobileLink = [
  'flex items-center justify-between min-h-12 py-3.5 text-base font-medium text-[var(--nav-text)]',
  'border-b border-white/5 dark:border-white/5 light:border-black/5',
  'transition-colors hover:text-[var(--nav-hover)] touch-manipulation',
  focusRing,
  '[&.active]:text-[#d2ff3a] [&.active]:font-bold',
].join(' ')

const ghostButton = [
  'inline-flex items-center justify-center px-4 py-2 text-xs font-semibold uppercase tracking-wider whitespace-nowrap',
  'dark:text-[#e3e2e3] light:text-[#121314]',
  'border border-white/15 light:border-black/15 rounded-full',
  'hover:bg-white/10 dark:hover:bg-white/10 light:hover:bg-black/5 transition touch-manipulation',
  focusRing,
].join(' ')

const primaryButton = [
  'group/cta inline-flex items-center justify-center gap-1.5 px-5 py-2 text-xs font-bold uppercase tracking-wider whitespace-nowrap',
  'text-[#090a0b] bg-[#d2ff3a] rounded-full',
  'hover:bg-[#c7f32c] hover:shadow-[0_0_24px_rgba(210,255,58,0.45)]',
  'transition-all active:scale-95 touch-manipulation',
  focusRing,
].join(' ')

// 44px touch target on mobile, compact on desktop
const iconButton =
  'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full touch-manipulation lg:h-9 lg:w-9'

/* Component --------------------------------------------------------------- */

export function Header({ settings = DEFAULT_SITE_SETTINGS_FALLBACK }: HeaderProps) {
  const { resolvedTheme, setTheme } = useTheme()
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  const [mounted, setMounted] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mobileFeaturesExpanded, setMobileFeaturesExpanded] = useState(false)
  const [featuresOpen, setFeaturesOpen] = useState(false)

  const headerRef = useRef<HTMLElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const mobileToggleRef = useRef<HTMLButtonElement>(null)
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([])
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const menuId = useId()

  const isDark = resolvedTheme === 'dark'
  const isFeatureActive = FEATURE_ITEMS.some((item) => pathname === item.to)

  const loginUrl = settings?.headerCtas?.loginUrl || 'https://app.scryme.tech/login'
  const loginLabel = settings?.headerCtas?.loginLabel || 'Sign In'
  const primaryCtaUrl = settings?.headerCtas?.primaryCtaUrl || 'https://app.scryme.tech/signup?plan=free'
  const primaryCtaLabel = settings?.headerCtas?.primaryCtaLabel || 'Get Started'

  useEffect(() => setMounted(true), [])

  /* Elevate header after scrolling */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  /* Expose the real header height (banner included) so the mobile drawer can sit right below it */
  useEffect(() => {
    const el = headerRef.current
    if (!el) return
    const update = () => el.style.setProperty('--header-h', `${el.offsetHeight}px`)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  /* Close menus on route change */
  useEffect(() => {
    setMobileMenuOpen(false)
    setFeaturesOpen(false)
  }, [pathname])

  /* Close the mobile drawer if the viewport grows into the desktop layout (rotate / resize) */
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const onChange = (e: MediaQueryListEvent) => {
      if (e.matches) setMobileMenuOpen(false)
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

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

  useEffect(() => {
    if (!featuresOpen) return
    // pointerdown covers mouse, touch and pen (e.g. iPad landscape uses the desktop nav)
    const onPointer = (e: PointerEvent) => {
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
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [featuresOpen])

  useEffect(() => {
    if (!mobileMenuOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false)
        mobileToggleRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    const prevOverscroll = document.documentElement.style.overscrollBehavior
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overscrollBehavior = 'none'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      document.documentElement.style.overscrollBehavior = prevOverscroll
    }
  }, [mobileMenuOpen])

  const toggleMobileMenu = () => {
    setMobileMenuOpen((open) => {
      // Start collapsed so the CTAs stay visible; auto-expand when on a feature page
      if (!open) setMobileFeaturesExpanded(isFeatureActive)
      return !open
    })
  }

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

  // Hover should only open the menu for real mice; on touch the click toggles it.
  // (Otherwise tap => synthetic mouseenter opens it => click toggles it straight back shut.)
  const isMouse = (e: React.PointerEvent) => e.pointerType === 'mouse'

  return (
    // The blur/background lives on an absolutely-positioned layer (below) instead of on <header>.
    // backdrop-filter on an ancestor turns it into the containing block for `position: fixed`
    // children, which breaks a full-screen mobile drawer.
    <header
      ref={headerRef}
      className={`sticky top-0 z-50 border-b transition-[border-color,box-shadow] duration-300 ${
        scrolled
          ? 'border-white/15 dark:border-white/15 light:border-black/15 shadow-lg shadow-black/10'
          : 'border-white/10 dark:border-white/10 light:border-black/10'
      }`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[var(--header-bg)] backdrop-blur-xl"
      />

      {settings?.announcementBanner?.enabled && settings.announcementBanner.text && (
        <div
          className={`w-full bg-[#d2ff3a] text-[#090a0b] py-1.5 text-center text-xs font-semibold flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 ${gutter}`}
        >
          <span className="text-balance">{settings.announcementBanner.text}</span>
          {settings.announcementBanner.linkUrl && (
            <a
              href={settings.announcementBanner.linkUrl}
              className="underline underline-offset-2 hover:opacity-80 whitespace-nowrap"
            >
              {settings.announcementBanner.linkText || 'Learn more'}
            </a>
          )}
        </div>
      )}

      <div className={`${gutter} transition-[padding] duration-300 ${scrolled ? 'py-2' : 'py-3 md:py-3.5'}`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 sm:gap-4">
          {/* Logo */}
          <Link
            to="/"
            className={`flex shrink-0 items-center gap-2 sm:gap-2.5 group rounded-lg ${focusRing}`}
            aria-label="Scryme home"
          >
            <div className="w-9 h-9 shrink-0 rounded-lg bg-[#d2ff3a] flex items-center justify-center text-[#090a0b] shadow-sm transition-all duration-200 group-hover:scale-105 group-hover:-rotate-3 group-hover:shadow-[0_0_18px_rgba(210,255,58,0.45)]">
              <Layers className="w-5 h-5 stroke-[2.5]" />
            </div>
            <span className="text-lg sm:text-xl font-bold tracking-tight font-sans whitespace-nowrap dark:text-white light:text-[#090a0b]">
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
              onPointerEnter={(e) => isMouse(e) && openFeatures()}
              onPointerLeave={(e) => isMouse(e) && scheduleClose()}
              onBlur={(e) => {
                if (!dropdownRef.current?.contains(e.relatedTarget as Node)) setFeaturesOpen(false)
              }}
            >
              <button
                ref={triggerRef}
                type="button"
                onClick={(e) => {
                  const type = (e.nativeEvent as PointerEvent).pointerType
                  // A mouse click while hovering keeps the menu open; touch / pen / keyboard toggle it
                  if (type === 'mouse') openFeatures()
                  else setFeaturesOpen((o) => !o)
                }}
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
                <div className="absolute top-full left-1/2 -translate-x-1/2 pt-3 w-[40rem] max-w-[calc(100vw-2rem)] z-50">
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
                              className={`mt-0.5 p-2 rounded-lg shrink-0 transition-all duration-200 ${
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

                      <a
                        href={primaryCtaUrl}
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
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {mounted ? (
              <button
                onClick={() => {
                  const nextTheme = isDark ? 'light' : 'dark'
                  setTheme(nextTheme)
                  trackOpenPanelEvent('theme_changed', { theme: nextTheme, source: 'header_toggle' })
                }}
                aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
                className={`${iconButton} relative border border-white/10 dark:border-white/15 light:border-black/15 text-[var(--text-main)] hover:bg-white/10 dark:hover:bg-white/10 light:hover:bg-black/5 transition ${focusRing}`}
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
              // Same size as the real button so nothing shifts on hydration
              <span className={iconButton} aria-hidden />
            )}

            <a href={loginUrl} className={`hidden sm:inline-flex ${ghostButton}`}>
              {loginLabel}
            </a>
            <a href={primaryCtaUrl} className={`hidden sm:inline-flex ${primaryButton}`}>
              <span>{primaryCtaLabel}</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/cta:translate-x-0.5" />
            </a>

            {/* Mobile toggle */}
            <button
              ref={mobileToggleRef}
              onClick={toggleMobileMenu}
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-nav"
              className={`${iconButton} lg:hidden rounded-lg text-[var(--text-main)] hover:bg-white/10 transition ${focusRing}`}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer: full-screen panel directly below the header (uses real header height) */}
      {mobileMenuOpen && (
        <div
          id="mobile-nav"
          className="lg:hidden fixed inset-x-0 bottom-0 top-[var(--header-h,4rem)] z-50 overflow-y-auto overscroll-contain bg-[var(--bg-main)] animate-in fade-in slide-in-from-top-2 duration-200 motion-reduce:animate-none"
        >
          <div
            className={`flex min-h-full flex-col gap-6 pt-2 pb-[max(1.5rem,env(safe-area-inset-bottom))] ${gutter}`}
          >
            <nav aria-label="Mobile" className="flex flex-col">
              <Link to="/" activeOptions={{ exact: true }} className={mobileLink}>
                Platform
              </Link>

              <div className="border-b border-white/5 dark:border-white/5 light:border-black/5">
                <button
                  type="button"
                  onClick={() => setMobileFeaturesExpanded((p) => !p)}
                  aria-expanded={mobileFeaturesExpanded}
                  aria-controls="mobile-features"
                  className={`w-full flex items-center justify-between min-h-12 py-3.5 text-base font-medium cursor-pointer touch-manipulation transition-colors ${focusRing} ${
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
                          className={`flex items-center gap-3 p-2.5 min-h-12 rounded-xl transition-all touch-manipulation ${focusRing} ${
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
                              <span className="text-xs leading-snug text-[var(--text-muted)] line-clamp-2">
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

            {/* mt-auto pins the CTAs to the bottom of the screen on tall phones */}
            <div className="mt-auto flex flex-col sm:flex-row gap-3">
              <a href={loginUrl} className={`${ghostButton} flex-1 py-3.5`}>
                {loginLabel}
              </a>
              <a href={primaryCtaUrl} className={`${primaryButton} flex-1 py-3.5`}>
                <span>{primaryCtaLabel}</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/cta:translate-x-0.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}