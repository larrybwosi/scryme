import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import {
  Check,
  CheckCircle2,
  ChefHat,
  ChevronDown,
  Cloud,
  CreditCard,
  Download,
  Flame,
  MessageSquare,
  Printer,
  QrCode,
  Radio,
  Receipt,
  RefreshCw,
  Router as RouterIcon,
  Scale,
  Scan,
  Store,
  Terminal,
  Utensils,
  Wine,
} from 'lucide-react'

export const Route = createFileRoute('/point-of-sale')({
  component: PointOfSaleComponent,
})

/* ---------- 1. Top Live POS Mesh Telemetry Strip ---------- */

function LivePosStrip() {
  return (
    <section data-scroll-reveal="fade-in" className="w-full border-b border-[#12372a]/30 bg-[#002116] px-4 py-2.5 text-white md:px-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 text-sm md:flex-row">
        <div className="flex items-center gap-3">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#bef529] opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#bef529]" />
          </span>
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[#bef529]">
            POS RUNTIME v3.4 ACTIVE
          </span>
          <span className="hidden text-[#c1c8c3]/60 sm:inline">•</span>
          <span className="hidden font-mono text-xs text-[#e3e2e0] sm:inline">
            8,420 TERMINALS ONLINE
          </span>
          <span className="hidden text-[#c1c8c3]/60 sm:inline">•</span>
          <span className="hidden font-mono text-xs text-[#e3e2e0] sm:inline">
            P99 CHECKOUT: 0.84s
          </span>
          <span className="hidden text-[#c1c8c3]/60 lg:inline">•</span>
          <span className="hidden font-mono text-xs font-medium text-[#bef529] lg:inline">
            OFFLINE CACHE: ZERO-LOSS RECONCILED
          </span>
        </div>
        <div className="flex items-center gap-4 font-mono text-xs text-[#e9e8e5]">
          <span>
            London Regent: <strong className="font-medium text-[#bef529]">100%</strong>
          </span>
          <span>
            Paris Haussmann: <strong className="font-medium text-[#bef529]">99.9%</strong>
          </span>
          <span>
            Tokyo Ginza: <strong className="font-medium text-[#bef529]">100%</strong>
          </span>
        </div>
      </div>
    </section>
  )
}

/* ---------- 2. Editorial Hero Section ---------- */

function PosHero() {
  const scrollToCockpit = () => {
    document.getElementById('pos-cockpit')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section data-scroll-reveal="fade-in" className="w-full bg-[var(--bg-main)] px-4 py-16 md:px-8 lg:py-20">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-12 lg:flex-row lg:items-end">
        <div className="flex max-w-3xl flex-col gap-6">
          <div className="flex items-center gap-2">
            <span className="rounded bg-[var(--bg-tertiary)] px-2 py-0.5 font-mono text-xs font-medium uppercase tracking-widest text-[#12372a]">
              CORE PILLAR 05
            </span>
            <span className="font-sans text-xs font-medium tracking-wide text-[var(--text-muted)]">
              POINT OF SALE &amp; UNIFIED CHECKOUT
            </span>
          </div>
          <h1 className="font-serif text-4xl font-normal leading-tight text-[var(--text-main)] sm:text-5xl lg:text-6xl">
            Sub-second physical checkout bound deterministically to the global ledger.
          </h1>
          <p className="max-w-2xl font-sans text-base leading-relaxed text-[var(--text-muted)] sm:text-lg">
            Coordinate high-volume retail registers, table-side hospitality, and kitchen display systems (KDS) across
            native Windows, macOS, and Linux hardware. Zero cloud latency, local offline resilience, and instantaneous ERP
            inventory decrements.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={scrollToCockpit}
              className="flex cursor-pointer items-center gap-2 rounded-lg bg-[#002116] px-5 py-3 font-sans text-xs font-bold uppercase tracking-wider text-white shadow-md transition-all hover:bg-[#12372a]"
            >
              <Store className="h-4.5 w-4.5 text-[#bef529]" />
              Launch Interactive POS Terminal
            </button>
            <a
              href="https://app.scryme.tech/signup?plan=scale&billing=annual&trial=true"
              className="flex items-center gap-2 rounded-lg bg-white px-5 py-3 font-sans text-xs font-semibold uppercase tracking-wider text-[var(--text-main)] shadow-sm transition-all hover:bg-[var(--bg-secondary)]"
            >
              <Download className="h-4.5 w-4.5 text-[var(--text-main)]" />
              Download Desktop Client (v3.4)
            </a>
          </div>

          {/* OS Badges */}
          <div className="flex flex-wrap items-center gap-2 pt-2 font-mono text-xs text-[var(--text-muted)]">
            <span className="uppercase tracking-wider text-[#717974]">Supported OS:</span>
            <span className="rounded bg-white px-2 py-0.5 font-medium shadow-sm">Windows 10/11 IoT</span>
            <span className="rounded bg-white px-2 py-0.5 font-medium shadow-sm">macOS Apple Silicon</span>
            <span className="rounded bg-white px-2 py-0.5 font-medium shadow-sm">Debian &amp; Ubuntu</span>
            <span className="rounded bg-white px-2 py-0.5 font-medium shadow-sm">Yocto Linux ARM</span>
          </div>
        </div>

        {/* Quick Telemetry Card */}
        <div className="flex w-full flex-col gap-3 rounded-xl bg-white p-6 shadow-sm lg:w-80">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Fleet Sync State
            </span>
            <span className="font-mono text-[11px] font-bold text-[#4d6700] dark:text-[#d2ff3a]">MUTUAL TLS v1.3</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-3xl font-normal text-[var(--text-main)]">0.84s</span>
            <span className="font-sans text-xs text-[var(--text-muted)]">p99 checkout auth</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-tertiary)]">
            <div className="h-full rounded-full bg-[#a4d700]" style={{ width: '98.4%' }} />
          </div>
          <div className="flex items-center justify-between font-mono text-xs text-[var(--text-muted)]">
            <span>Active Edge Hubs</span>
            <span className="font-semibold text-[var(--text-main)]">312 Stores</span>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- 3. Interactive Terminal & Peripheral Simulator ---------- */

function TerminalCockpit() {
  const [mode, setMode] = useState<'retail' | 'kds'>('retail')
  const [authStatus, setAuthStatus] = useState<'idle' | 'processing' | 'approved'>('idle')

  const handleSimulateAuth = () => {
    setAuthStatus('processing')
    setTimeout(() => {
      setAuthStatus('approved')
      setTimeout(() => {
        setAuthStatus('idle')
      }, 2500)
    }, 400)
  }

  return (
    <section id="pos-cockpit" className="w-full bg-[var(--bg-secondary)] px-4 py-16 md:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[var(--text-main)]">
              Hardware-in-the-Loop Emulation
            </span>
            <h2 className="mt-1 font-serif text-3xl font-normal text-[var(--text-main)]">
              Dual-Mode Universal Terminal Cockpit
            </h2>
          </div>
          {/* Mode Switcher */}
          <div className="inline-flex rounded-lg bg-[#e3e2e0] p-1">
            <button
              type="button"
              onClick={() => setMode('retail')}
              className={`flex cursor-pointer items-center gap-2 rounded-md px-4 py-2 font-sans text-xs font-semibold transition-all ${
                mode === 'retail'
                  ? 'bg-[#002116] text-white shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              <Store className="h-4 w-4" />
              Retail High-Velocity Register
            </button>
            <button
              type="button"
              onClick={() => setMode('kds')}
              className={`flex cursor-pointer items-center gap-2 rounded-md px-4 py-2 font-sans text-xs font-semibold transition-all ${
                mode === 'kds'
                  ? 'bg-[#002116] text-white shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              <Utensils className="h-4 w-4" />
              Restaurant Table &amp; KDS
            </button>
          </div>
        </div>

        {/* Simulator Container */}
        <div className="rounded-xl bg-white p-4 shadow-md">
          {mode === 'retail' ? (
            /* Retail Mode Interface */
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              {/* Register / Scanner Pane */}
              <div className="flex flex-col gap-4 rounded-lg bg-[var(--bg-secondary)] p-4 lg:col-span-5">
                <div className="flex items-center justify-between border-b border-[#e3e2e0] pb-2">
                  <div className="flex items-center gap-2">
                    <Scan className="h-5 w-5 text-[var(--text-main)]" />
                    <span className="font-sans text-sm font-semibold text-[var(--text-main)]">
                      Lane 04 • Cashier #841
                    </span>
                  </div>
                  <span className="rounded bg-[#bef529] px-2 py-0.5 font-mono text-[11px] font-semibold text-[var(--text-main)]">
                    HONEYWELL SCANNER LIVE
                  </span>
                </div>

                {/* Loyalty card info */}
                <div className="flex items-center justify-between rounded-md bg-white p-2.5 shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#12372a] font-mono text-xs text-white">
                      CL
                    </div>
                    <div>
                      <div className="font-sans text-xs font-semibold leading-tight text-[var(--text-main)]">
                        Claire Laurent
                      </div>
                      <div className="font-sans text-[11px] text-[var(--text-muted)]">
                        Tier: Noir VIP (15% Auto-Disc)
                      </div>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-bold text-[#4d6700] dark:text-[#d2ff3a]">2,480 PTS</span>
                </div>

                {/* Scanned items list */}
                <div className="flex max-h-64 flex-col gap-2 overflow-y-auto pr-1">
                  <div className="flex items-center justify-between rounded-md bg-white p-2 text-xs">
                    <div>
                      <div className="font-medium text-[var(--text-main)]">
                        Cashmere Belted Overcoat (Olive)
                      </div>
                      <div className="font-mono text-[11px] text-[var(--text-muted)]">
                        SKU-9921-OLV • Qty: 1
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <div className="font-semibold text-[var(--text-main)]">$1,280.00</div>
                      <div className="text-[11px] text-[#717974] line-through">$1,450.00</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-md bg-white p-2 text-xs">
                    <div>
                      <div className="font-medium text-[var(--text-main)]">
                        Full-Grain Leather Chelsea Boots
                      </div>
                      <div className="font-mono text-[11px] text-[var(--text-muted)]">
                        SKU-4412-BRN • Size 43 • Qty: 1
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <div className="font-semibold text-[var(--text-main)]">$540.00</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-md bg-white p-2 text-xs">
                    <div>
                      <div className="font-medium text-[var(--text-main)]">Silk Lapel Pocket Square</div>
                      <div className="font-mono text-[11px] text-[var(--text-muted)]">
                        SKU-1094-IVR • Qty: 2
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <div className="font-semibold text-[var(--text-main)]">$170.00</div>
                    </div>
                  </div>
                </div>

                {/* Calculation block */}
                <div className="mt-auto flex flex-col gap-1 border-t border-[#e3e2e0] pt-2 font-mono text-xs">
                  <div className="flex justify-between text-[var(--text-muted)]">
                    <span>Gross Subtotal</span>
                    <span>$1,990.00</span>
                  </div>
                  <div className="flex justify-between text-[#4d6700] dark:text-[#d2ff3a]">
                    <span>VIP Noir Discount (-15%)</span>
                    <span>-$298.50</span>
                  </div>
                  <div className="flex justify-between text-[var(--text-muted)]">
                    <span>VAT / Tax (8.25%)</span>
                    <span>$139.55</span>
                  </div>
                  <div className="flex justify-between pt-1 font-sans text-base font-semibold text-[var(--text-main)]">
                    <span>Total Due</span>
                    <span>$1,831.05</span>
                  </div>
                </div>
              </div>

              {/* Middle Payment Terminal Pane */}
              <div className="flex flex-col justify-between gap-4 rounded-lg bg-[var(--bg-secondary)] p-4 lg:col-span-4">
                <div>
                  <div className="mb-3 flex items-center justify-between border-b border-[#e3e2e0] pb-2">
                    <div className="flex items-center gap-2">
                      <Radio className="h-5 w-5 text-[var(--text-main)]" />
                      <span className="font-sans text-sm font-semibold text-[var(--text-main)]">
                        Ingenico Axium DX8000
                      </span>
                    </div>
                    <span className="rounded bg-[#e3e2e0] px-2 py-0.5 font-mono text-[11px] text-[var(--text-muted)]">
                      IP: 192.168.1.42
                    </span>
                  </div>

                  {/* Interactive Card Reader Simulator */}
                  <div className="flex flex-col items-center gap-4 rounded-xl bg-[#002116] p-4 text-center text-white shadow-inner">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-[#bef529]">
                      ADYEN / CHASE TERMINAL HANDSHAKE
                    </span>
                    <div className="flex h-14 w-14 animate-pulse items-center justify-center rounded-full bg-[#12372a]">
                      <Radio className="h-8 w-8 text-[#bef529]" />
                    </div>
                    <div>
                      <div className="font-serif text-3xl font-medium text-white">$1,831.05</div>
                      <div className="font-mono text-xs text-[#a8cfbd]">
                        HOLD CARD OR DEVICE NEAR READER
                      </div>
                    </div>
                    <div className="grid w-full grid-cols-2 gap-2 rounded-lg bg-[#12372a]/80 p-2.5 text-left font-mono text-[10px] text-[#c3ebd8]">
                      <div>PROTOCOL: EMV 3.0</div>
                      <div>CIPHER: AES-256-GCM</div>
                      <div>AUTH LATENCY: 0.38s</div>
                      <div>BATCH: #84102-A</div>
                    </div>
                  </div>
                </div>

                {/* Quick Payment Actions */}
                <div className="flex flex-col gap-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      className="flex cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-white px-3 py-2.5 font-sans text-xs font-semibold text-[var(--text-main)] transition-all hover:bg-[#e3e2e0]"
                    >
                      <QrCode className="h-4 w-4" />
                      WeChat / Alipay
                    </button>
                    <button
                      type="button"
                      className="flex cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-white px-3 py-2.5 font-sans text-xs font-semibold text-[var(--text-main)] transition-all hover:bg-[#e3e2e0]"
                    >
                      <CreditCard className="h-4 w-4" />
                      Split 50/50
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={handleSimulateAuth}
                    disabled={authStatus !== 'idle'}
                    className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-3 font-sans text-xs font-bold transition-all shadow-sm ${
                      authStatus === 'approved'
                        ? 'bg-[#a4d700] text-[#151f00]'
                        : 'bg-[#bef529] text-[#151f00] hover:bg-[#a4d700]'
                    }`}
                  >
                    {authStatus === 'processing' && (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Processing EMV Handshake (0.38s)...
                      </>
                    )}
                    {authStatus === 'approved' && (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-[#151f00]" />
                        APPROVED #84102-A // SENT TO LEDGER
                      </>
                    )}
                    {authStatus === 'idle' && (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        Simulate 0.4s Instant EMV Tap
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Thermal Receipt Pane */}
              <div className="flex flex-col gap-3 rounded-lg bg-[var(--bg-secondary)] p-4 lg:col-span-3">
                <div className="flex items-center justify-between border-b border-[#e3e2e0] pb-2">
                  <div className="flex items-center gap-1.5">
                    <Receipt className="h-5 w-5 text-[var(--text-main)]" />
                    <span className="font-sans text-sm font-semibold text-[var(--text-main)]">
                      Star TSP143IV
                    </span>
                  </div>
                  <span className="rounded bg-[var(--bg-tertiary)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--text-muted)]">
                    AUTO-CUT
                  </span>
                </div>

                {/* Thermal Paper Mockup */}
                <div className="flex select-none flex-col gap-1 rounded-md bg-white p-3 font-mono text-[11px] leading-tight text-[#1a1c1a] shadow-sm">
                  <div className="pb-1 text-center font-bold text-xs uppercase tracking-wider">
                    SCRYME FLAGSHIP STORE
                  </div>
                  <div className="text-center text-[10px] text-[#717974]">
                    REGENT STREET • LONDON W1B 5AH
                    <br />
                    TEL: +44 20 7946 0912
                  </div>
                  <div className="my-1 border-b border-dashed border-[#c1c8c3]" />
                  <div className="flex justify-between text-[10px]">
                    <span>TX: #9042-881</span>
                    <span>2025-05-18 14:28:11</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span>CASHIER: LANE-04</span>
                    <span>VIP: CLAIRE L.</span>
                  </div>
                  <div className="my-1 border-b border-dashed border-[#c1c8c3]" />
                  <div className="flex justify-between">
                    <span>1x CASHMERE OVERCOAT</span>
                    <span>$1,280.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>1x CHELSEA BOOTS (43)</span>
                    <span>$540.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>2x SILK POCKET SQ</span>
                    <span>$170.00</span>
                  </div>
                  <div className="my-1 border-b border-dashed border-[#c1c8c3]" />
                  <div className="flex justify-between font-bold text-[#4d6700] dark:text-[#d2ff3a]">
                    <span>VIP NOIR DISC (-15%)</span>
                    <span>-$298.50</span>
                  </div>
                  <div className="flex justify-between">
                    <span>VAT (8.25%)</span>
                    <span>$139.55</span>
                  </div>
                  <div className="flex justify-between pt-1 text-xs font-bold">
                    <span>TOTAL PAID</span>
                    <span>$1,831.05</span>
                  </div>
                  <div className="my-1 border-b border-dashed border-[#c1c8c3]" />
                  <div className="pt-1 text-center text-[9px] text-[var(--text-muted)]">
                    AUTH CODE: 981244 // VISA CONTACTLESS
                    <br />
                    ERP LEDGER SYNCHRONIZED #GL-88102
                    <br />
                    30-DAY IN-STORE RETURN GUARANTEE
                  </div>
                  <div className="flex justify-center pt-2">
                    <div className="flex h-6 w-36 items-center justify-center bg-[#002116] font-mono text-[8px] tracking-widest text-white">
                      |||| || | ||||| |||| |
                    </div>
                  </div>
                </div>

                <div className="mt-auto flex items-center gap-2">
                  <button
                    type="button"
                    className="flex w-full items-center justify-center gap-1 rounded bg-[#e3e2e0] py-2 font-sans text-xs font-medium text-[var(--text-main)] transition-colors hover:bg-[var(--bg-tertiary)]"
                  >
                    <MessageSquare className="h-4 w-4" />
                    SMS e-Receipt
                  </button>
                  <button
                    type="button"
                    className="flex w-full items-center justify-center gap-1 rounded bg-[#e3e2e0] py-2 font-sans text-xs font-medium text-[var(--text-main)] transition-colors hover:bg-[var(--bg-tertiary)]"
                  >
                    <Printer className="h-4 w-4" />
                    Feed / Cut
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Restaurant & KDS Mode Interface */
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              {/* Floor Plan / Table Map */}
              <div className="flex flex-col gap-3 rounded-lg bg-[var(--bg-secondary)] p-4 lg:col-span-5">
                <div className="flex items-center justify-between border-b border-[#e3e2e0] pb-2">
                  <div className="flex items-center gap-2">
                    <Utensils className="h-5 w-5 text-[var(--text-main)]" />
                    <span className="font-sans text-sm font-semibold text-[var(--text-main)]">
                      Dining Room Floorplan • 12 Active Tables
                    </span>
                  </div>
                  <span className="rounded bg-[#bef529] px-2 py-0.5 font-mono text-[11px] font-bold text-[var(--text-main)]">
                    COVER: 38/46
                  </span>
                </div>

                {/* Table Grid */}
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="flex flex-col gap-1 rounded-lg border-l-4 border-[#bef529] bg-white p-2.5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-[var(--text-main)]">T-01</span>
                      <span className="rounded bg-[#bef529] px-1 font-mono text-[10px] text-[#526d00]">
                        ENTRÉE
                      </span>
                    </div>
                    <div className="font-sans text-[11px] text-[var(--text-muted)]">4 Guests • 38m</div>
                    <div className="font-mono text-xs font-semibold text-[var(--text-main)]">$324.50</div>
                  </div>

                  <div className="flex flex-col gap-1 rounded-lg border-l-4 border-[#002116] bg-white p-2.5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-[var(--text-main)]">T-02</span>
                      <span className="rounded bg-[var(--bg-tertiary)] px-1 font-mono text-[10px] text-[var(--text-muted)]">
                        SEATED
                      </span>
                    </div>
                    <div className="font-sans text-[11px] text-[var(--text-muted)]">2 Guests • 8m</div>
                    <div className="font-mono text-xs font-semibold text-[var(--text-main)]">$42.00</div>
                  </div>

                  <div className="flex flex-col gap-1 rounded-lg border-l-4 border-[#ba1a1a] bg-white p-2.5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-[var(--text-main)]">T-03</span>
                      <span className="rounded bg-[#ffdad6] px-1 font-mono text-[10px] font-semibold text-[#ba1a1a]">
                        ATTN 22m
                      </span>
                    </div>
                    <div className="font-sans text-[11px] text-[var(--text-muted)]">6 Guests • 54m</div>
                    <div className="font-mono text-xs font-semibold text-[var(--text-main)]">$680.00</div>
                  </div>

                  <div className="flex flex-col gap-1 rounded-lg border-l-4 border-[#a4d700] bg-white p-2.5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-[var(--text-main)]">T-04</span>
                      <span className="rounded bg-[#bef529] px-1 font-mono text-[10px] font-bold text-[var(--text-main)]">
                        BILLED
                      </span>
                    </div>
                    <div className="font-sans text-[11px] text-[var(--text-muted)]">2 Guests • 1h 12m</div>
                    <div className="font-mono text-xs font-semibold text-[var(--text-main)]">$195.00</div>
                  </div>

                  <div className="flex flex-col gap-1 rounded-lg bg-white p-2.5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-[var(--text-main)]">T-05</span>
                      <span className="rounded bg-[#e3e2e0] px-1 font-mono text-[10px] text-[var(--text-muted)]">
                        VACANT
                      </span>
                    </div>
                    <div className="font-sans text-[11px] text-[var(--text-muted)]">4 Seats • Ready</div>
                    <div className="font-mono text-xs font-semibold text-[#c1c8c3]">--</div>
                  </div>

                  <div className="flex flex-col gap-1 rounded-lg border-l-4 border-[#bef529] bg-white p-2.5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-[var(--text-main)]">T-06</span>
                      <span className="rounded bg-[#bef529] px-1 font-mono text-[10px] text-[#526d00]">
                        DESSERT
                      </span>
                    </div>
                    <div className="font-sans text-[11px] text-[var(--text-muted)]">3 Guests • 48m</div>
                    <div className="font-mono text-xs font-semibold text-[var(--text-main)]">$278.00</div>
                  </div>
                </div>

                {/* Seat splitting actions */}
                <div className="mt-auto flex items-center justify-between rounded-lg bg-white p-3">
                  <div>
                    <div className="font-sans text-xs font-semibold text-[var(--text-main)]">
                      Selected: Table 03 (6 Seats)
                    </div>
                    <div className="font-sans text-xs text-[var(--text-muted)]">
                      Seat 1 &amp; 2: Wine tab • Seat 3-6: Shared Food
                    </div>
                  </div>
                  <button
                    type="button"
                    className="rounded bg-[#002116] px-3 py-1.5 font-sans text-xs font-semibold text-white transition-all hover:bg-[#12372a]"
                  >
                    Split Check by Seat
                  </button>
                </div>
              </div>

              {/* KDS Live Station Queue Pane */}
              <div className="flex flex-col gap-3 rounded-lg bg-[var(--bg-secondary)] p-4 lg:col-span-7">
                <div className="flex items-center justify-between border-b border-[#e3e2e0] pb-2">
                  <div className="flex items-center gap-2">
                    <ChefHat className="h-5 w-5 text-[var(--text-main)]" />
                    <span className="font-sans text-sm font-semibold text-[var(--text-main)]">
                      KDS Expediter Hub • Line 1 (Grill / Sauté / Pastry)
                    </span>
                  </div>
                  <span className="font-mono text-[11px] text-[var(--text-muted)]">
                    BUMP BAR KEYPAD: READY
                  </span>
                </div>

                {/* Ticket Carousel */}
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {/* Ticket 1 (Urgent) */}
                  <div className="flex flex-col gap-2 rounded-lg border-t-4 border-[#ba1a1a] bg-white p-3 shadow-sm">
                    <div className="flex items-start justify-between font-mono text-xs">
                      <div>
                        <span className="text-sm font-bold text-[var(--text-main)]">#408 • T-03</span>
                        <span className="block text-[var(--text-muted)]">Server: Marco • 6 Guests</span>
                      </div>
                      <div className="animate-pulse rounded bg-[#ffdad6] px-2 py-0.5 font-bold text-[#ba1a1a]">
                        08:42 EXCEEDED
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5 border-t border-[#efeeeb] pt-1 font-sans text-xs">
                      <div className="flex justify-between">
                        <span>2x Dry-Aged Wagyu Ribeye</span>
                        <span className="font-mono text-xs font-bold text-[#ba1a1a]">
                          MED-RARE
                        </span>
                      </div>
                      <div className="pl-3 italic text-[var(--text-muted)]">↳ Extra Truffle Butter, NO Garlic</div>
                      <div className="flex justify-between">
                        <span>1x Chilean Sea Bass</span>
                        <span className="font-mono text-xs text-[var(--text-muted)]">Sauté Station</span>
                      </div>
                      <div className="flex justify-between">
                        <span>3x Duck Fat Pommes Frites</span>
                        <span className="font-mono text-xs text-[var(--text-muted)]">Side / Fry</span>
                      </div>
                    </div>
                    <div className="mt-auto flex gap-2 pt-2">
                      <button
                        type="button"
                        className="w-full rounded bg-[#bef529] py-1.5 font-mono text-xs font-bold text-[#526d00] transition-all hover:bg-[#a4d700]"
                      >
                        BUMP TICKET [KEY 1]
                      </button>
                      <button
                        type="button"
                        className="rounded bg-[var(--bg-tertiary)] px-3 py-1.5 font-sans text-xs font-semibold text-[var(--text-main)]"
                      >
                        Recall
                      </button>
                    </div>
                  </div>

                  {/* Ticket 2 (In Progress) */}
                  <div className="flex flex-col gap-2 rounded-lg border-t-4 border-[#bef529] bg-white p-3 shadow-sm">
                    <div className="flex items-start justify-between font-mono text-xs">
                      <div>
                        <span className="text-sm font-bold text-[var(--text-main)]">#409 • T-01</span>
                        <span className="block text-[var(--text-muted)]">Server: Sophie • 4 Guests</span>
                      </div>
                      <div className="rounded bg-[#bef529] px-2 py-0.5 font-semibold text-[#526d00]">
                        03:15 PACING
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5 border-t border-[#efeeeb] pt-1 font-sans text-xs">
                      <div className="flex justify-between">
                        <span>1x Lobster Risotto</span>
                        <span className="font-mono text-xs font-bold text-[var(--text-main)]">FIRE ENTRÉE</span>
                      </div>
                      <div className="pl-3 italic text-[var(--text-muted)]">
                        ↳ Gluten Free Broth Substitution
                      </div>
                      <div className="flex justify-between">
                        <span>2x Pan-Seared Scallops</span>
                        <span className="font-mono text-xs text-[var(--text-muted)]">Sauté Station</span>
                      </div>
                      <div className="flex justify-between">
                        <span>1x Heritage Pork Belly</span>
                        <span className="font-mono text-xs text-[var(--text-muted)]">Grill Station</span>
                      </div>
                    </div>
                    <div className="mt-auto flex gap-2 pt-2">
                      <button
                        type="button"
                        className="w-full rounded bg-[#002116] py-1.5 font-mono text-xs font-bold text-white transition-all hover:bg-[#12372a]"
                      >
                        BUMP TICKET [KEY 2]
                      </button>
                      <button
                        type="button"
                        className="rounded bg-[var(--bg-tertiary)] px-3 py-1.5 font-sans text-xs font-semibold text-[var(--text-main)]"
                      >
                        Hold 5m
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

/* ---------- 4. 3 Industry Deployment Variants ---------- */

function IndustryVariants() {
  return (
    <section data-scroll-reveal="fade-in" className="w-full bg-[var(--bg-main)] px-4 py-16 md:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <div className="max-w-2xl">
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[var(--text-main)]">
            Vertical Adaptability
          </span>
          <h2 className="mt-1 font-serif text-3xl font-normal text-[var(--text-main)]">
            Engineered for Ultra-High Throughput Retail and Demanding Kitchens
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Variant 1 */}
          <div className="flex flex-col gap-6 rounded-xl bg-white p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-main)]">
              <Scan className="h-7 w-7" />
            </div>
            <div>
              <h3 className="font-serif text-xl font-medium text-[var(--text-main)]">
                Flagship &amp; Specialty Retail
              </h3>
              <p className="mt-2 font-sans text-sm leading-relaxed text-[var(--text-muted)]">
                RFID cart tunnels ring up 40 items in under 0.6 seconds. Unified with buy-online-pickup-in-store
                (BOPIS) lockers, endless aisle cross-store catalog dropshipping, and calibrated tare scales.
              </p>
            </div>
            <ul className="mt-auto flex flex-col gap-2 border-t border-[#efeeeb] pt-3 font-sans text-xs text-[#1a1c1a]">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-[#4d6700] dark:text-[#d2ff3a]" />
                Instant Zebra &amp; Datalogic scanner parsing
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-[#4d6700] dark:text-[#d2ff3a]" />
                Endless Aisle dropship to home address
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-[#4d6700] dark:text-[#d2ff3a]" />
                Gift registry &amp; multi-tender splits
              </li>
            </ul>
          </div>

          {/* Variant 2 */}
          <div className="flex flex-col gap-6 rounded-xl bg-white p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-main)]">
              <Wine className="h-7 w-7" />
            </div>
            <div>
              <h3 className="font-serif text-xl font-medium text-[var(--text-main)]">
                Full-Service Hospitality &amp; Bar
              </h3>
              <p className="mt-2 font-sans text-sm leading-relaxed text-[var(--text-muted)]">
                Sub-second tab transfers across multiple patio stations and main bars. Fire-and-hold course pacing,
                complex modifier trees, and automated gratuity tipping with instantaneous card pre-auth.
              </p>
            </div>
            <ul className="mt-auto flex flex-col gap-2 border-t border-[#efeeeb] pt-3 font-sans text-xs text-[#1a1c1a]">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-[#4d6700] dark:text-[#d2ff3a]" />
                Seat-level split checks in 2 taps
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-[#4d6700] dark:text-[#d2ff3a]" />
                Fire, hold, &amp; staggered course dispatch
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-[#4d6700] dark:text-[#d2ff3a]" />
                Table layout sync across 32 handhelds
              </li>
            </ul>
          </div>

          {/* Variant 3 */}
          <div className="flex flex-col gap-6 rounded-xl bg-white p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-main)]">
              <Flame className="h-7 w-7" />
            </div>
            <div>
              <h3 className="font-serif text-xl font-medium text-[var(--text-main)]">
                KDS &amp; Expediter Hub
              </h3>
              <p className="mt-2 font-sans text-sm leading-relaxed text-[var(--text-muted)]">
                Sub-millisecond routing from waiter mobile terminals straight to high-heat kitchen monitors. Full
                physical bump-bar key support, automated cooking pacing, and delivery aggregator auto-throttling.
              </p>
            </div>
            <ul className="mt-auto flex flex-col gap-2 border-t border-[#efeeeb] pt-3 font-sans text-xs text-[#1a1c1a]">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-[#4d6700] dark:text-[#d2ff3a]" />
                Hardware bump-bar USB/RS-232 support
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-[#4d6700] dark:text-[#d2ff3a]" />
                Dynamic station rerouting on prep overflow
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-[#4d6700] dark:text-[#d2ff3a]" />
                UberEats / DoorDash rider dispatch sync
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- 5. Cross-Platform OS Matrix ---------- */

function OsArchitectureMatrix() {
  return (
    <section data-scroll-reveal="fade-in" className="w-full bg-[var(--bg-secondary)] px-4 py-16 md:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[var(--text-main)]">
              Native Runtime Performance
            </span>
            <h2 className="mt-1 font-serif text-3xl font-normal text-[var(--text-main)]">
              Cross-Platform OS Engine: Rust &amp; C++ Core
            </h2>
            <p className="mt-2 font-sans text-sm text-[var(--text-muted)]">
              No bloated Electron shells. Scryme POS compiles to native machine binaries with a tiny 22MB RAM baseline,
              guaranteeing instant cold boot times and sub-millisecond USB peripheral polling.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 font-mono text-xs text-[var(--text-main)] shadow-sm">
            <span className="h-2 w-2 rounded-full bg-[#bef529]" />
            <span>HEAP: 22.4 MB // COLD START: 120ms</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Windows */}
          <div className="flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-sans text-sm font-semibold text-[var(--text-main)]">
                Windows 10/11 IoT
              </span>
              <span className="rounded bg-[var(--bg-tertiary)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--text-muted)]">
                OPOS / UPOS
              </span>
            </div>
            <p className="font-sans text-xs leading-relaxed text-[var(--text-muted)]">
              Direct driver compatibility with legacy serial RS-232 pole displays, APG cash drawers, and thermal receipt
              cutters without spooler lag.
            </p>
            <div className="mt-auto pt-2 font-mono text-[11px] font-medium text-[#4d6700] dark:text-[#d2ff3a]">
              DLL Direct Interop • x64 &amp; ARM64
            </div>
          </div>

          {/* macOS */}
          <div className="flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-sans text-sm font-semibold text-[var(--text-main)]">macOS &amp; iPadOS</span>
              <span className="rounded bg-[var(--bg-tertiary)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--text-muted)]">
                METAL GRAPHICS
              </span>
            </div>
            <p className="font-sans text-xs leading-relaxed text-[var(--text-muted)]">
              Pristine 120Hz ProMotion animations for luxury boutique counters. Zero driver setup with Apple AirPrint and
              Bonjour LAN device auto-discovery.
            </p>
            <div className="mt-auto pt-2 font-mono text-[11px] font-medium text-[#4d6700] dark:text-[#d2ff3a]">
              Apple Silicon M1-M4 Optimized
            </div>
          </div>

          {/* Linux Desktop */}
          <div className="flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-sans text-sm font-semibold text-[var(--text-main)]">
                Linux Enterprise
              </span>
              <span className="rounded bg-[var(--bg-tertiary)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--text-muted)]">
                SYSTEMD SERVICE
              </span>
            </div>
            <p className="font-sans text-xs leading-relaxed text-[var(--text-muted)]">
              Debian, Ubuntu &amp; RHEL packages. Rock-solid 24/7 uptime for unstaffed self-checkout kiosks and automated
              retail turnstiles.
            </p>
            <div className="mt-auto pt-2 font-mono text-[11px] font-medium text-[#4d6700] dark:text-[#d2ff3a]">
              Kernel evdev Direct USB Polling
            </div>
          </div>

          {/* Embedded Linux */}
          <div className="flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-sans text-sm font-semibold text-[var(--text-main)]">
                Yocto / Raspberry Pi
              </span>
              <span className="rounded bg-[var(--bg-tertiary)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--text-muted)]">
                EMBEDDED ARM
              </span>
            </div>
            <p className="font-sans text-xs leading-relaxed text-[var(--text-muted)]">
              Fanless, ruggedized kitchen display monitors operating inside 45°C kitchen environments. Zero licensing fees,
              read-only flash storage.
            </p>
            <div className="mt-auto pt-2 font-mono text-[11px] font-medium text-[#4d6700] dark:text-[#d2ff3a]">
              Sub-$100 Hardware Appliance BOM
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- 6. Direct Hardware Driver Ecosystem ---------- */

function HardwareEcosystem() {
  return (
    <section data-scroll-reveal="fade-in" className="w-full bg-[var(--bg-main)] px-4 py-16 md:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <div className="max-w-2xl">
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[var(--text-main)]">
            Plug-and-Play Compatibility
          </span>
          <h2 className="mt-1 font-serif text-3xl font-normal text-[var(--text-main)]">
            Direct Hardware Driver Ecosystem
          </h2>
          <p className="mt-2 font-sans text-sm text-[var(--text-muted)]">
            Eliminate clunky third-party print spoolers. Scryme contains native embedded protocol implementations
            communicating directly over USB, TCP/IP, Bluetooth Low Energy, and Serial.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Printers */}
          <div className="flex flex-col gap-2.5 rounded-xl bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 border-b border-[#efeeeb] pb-2 text-[var(--text-main)]">
              <Printer className="h-5.5 w-5.5" />
              <span className="font-sans text-sm font-semibold">Receipt Printers</span>
            </div>
            <div className="flex flex-col gap-1.5 font-mono text-xs text-[#1a1c1a]">
              <div className="flex justify-between">
                <span>Epson TM-T88VI / VII</span>
                <span className="font-bold text-[#4d6700] dark:text-[#d2ff3a]">ESC/POS</span>
              </div>
              <div className="flex justify-between">
                <span>Star TSP143IV / TSP654</span>
                <span className="font-bold text-[#4d6700] dark:text-[#d2ff3a]">StarPRNT</span>
              </div>
              <div className="flex justify-between">
                <span>Bixolon SRP-350plus</span>
                <span className="text-[var(--text-muted)]">Direct LAN</span>
              </div>
              <div className="flex justify-between">
                <span>Zebra ZD410 / ZD421</span>
                <span className="text-[var(--text-muted)]">ZPL Labels</span>
              </div>
            </div>
            <span className="mt-auto pt-2 font-mono text-[11px] text-[#717974]">
              Auto-cut • Dual Cash Drawer Trigger
            </span>
          </div>

          {/* Payment Readers */}
          <div className="flex flex-col gap-2.5 rounded-xl bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 border-b border-[#efeeeb] pb-2 text-[var(--text-main)]">
              <CreditCard className="h-5.5 w-5.5" />
              <span className="font-sans text-sm font-semibold">EMV Payment Terminals</span>
            </div>
            <div className="flex flex-col gap-1.5 font-mono text-xs text-[#1a1c1a]">
              <div className="flex justify-between">
                <span>Ingenico Axium / Lane</span>
                <span className="font-bold text-[#4d6700] dark:text-[#d2ff3a]">Direct IP</span>
              </div>
              <div className="flex justify-between">
                <span>BBPOS WisePOS E</span>
                <span className="font-bold text-[#4d6700] dark:text-[#d2ff3a]">Stripe Term</span>
              </div>
              <div className="flex justify-between">
                <span>Verifone P400 / V400m</span>
                <span className="text-[var(--text-muted)]">Adyen CAPI</span>
              </div>
              <div className="flex justify-between">
                <span>PAX A920 / A80</span>
                <span className="text-[var(--text-muted)]">Cloud API</span>
              </div>
            </div>
            <span className="mt-auto pt-2 font-mono text-[11px] text-[#717974]">
              P2PE Encrypted • PCI-PTS 5.x
            </span>
          </div>

          {/* Scanners */}
          <div className="flex flex-col gap-2.5 rounded-xl bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 border-b border-[#efeeeb] pb-2 text-[var(--text-main)]">
              <Scan className="h-5.5 w-5.5" />
              <span className="font-sans text-sm font-semibold">Barcode &amp; 2D Scanners</span>
            </div>
            <div className="flex flex-col gap-1.5 font-mono text-xs text-[#1a1c1a]">
              <div className="flex justify-between">
                <span>Zebra DS2208 / DS9308</span>
                <span className="font-bold text-[#4d6700] dark:text-[#d2ff3a]">CDC USB</span>
              </div>
              <div className="flex justify-between">
                <span>Honeywell Xenon 1950g</span>
                <span className="font-bold text-[#4d6700] dark:text-[#d2ff3a]">HID Wedge</span>
              </div>
              <div className="flex justify-between">
                <span>Datalogic Magellan 3450</span>
                <span className="text-[var(--text-muted)]">RS-232</span>
              </div>
              <div className="flex justify-between">
                <span>Cognex DataMan 8072</span>
                <span className="text-[var(--text-muted)]">DPM Matrix</span>
              </div>
            </div>
            <span className="mt-auto pt-2 font-mono text-[11px] text-[#717974]">
              Symbologies: UPC, EAN, DataMatrix, GS1
            </span>
          </div>

          {/* Drawers & Scales */}
          <div className="flex flex-col gap-2.5 rounded-xl bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 border-b border-[#efeeeb] pb-2 text-[var(--text-main)]">
              <Scale className="h-5.5 w-5.5" />
              <span className="font-sans text-sm font-semibold">Drawers &amp; NTEP Scales</span>
            </div>
            <div className="flex flex-col gap-1.5 font-mono text-xs text-[#1a1c1a]">
              <div className="flex justify-between">
                <span>APG Vasario 1616</span>
                <span className="font-bold text-[#4d6700] dark:text-[#d2ff3a]">RJ-12 Kick</span>
              </div>
              <div className="flex justify-between">
                <span>M-S Cash Drawer EP-125</span>
                <span className="font-bold text-[#4d6700] dark:text-[#d2ff3a]">Sensor Feed</span>
              </div>
              <div className="flex justify-between">
                <span>Mettler Toledo Ariva-S</span>
                <span className="text-[var(--text-muted)]">SMA Protocol</span>
              </div>
              <div className="flex justify-between">
                <span>Avery Weigh-Tronix 6710</span>
                <span className="text-[var(--text-muted)]">Tare Comm</span>
              </div>
            </div>
            <span className="mt-auto pt-2 font-mono text-[11px] text-[#717974]">
              NTEP Certified • Sub-ounce Precision
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- 7. Offline-First Resilience Engine ---------- */

function OfflineResilienceEngine() {
  return (
    <section data-scroll-reveal="fade-in" className="w-full bg-[#002116] px-4 py-16 text-white md:px-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-12 lg:flex-row">
        <div className="flex max-w-2xl flex-col gap-6">
          <span className="font-mono text-xs font-semibold uppercase tracking-widest text-[#bef529]">
            THE ZERO-DOWNTIME GUARANTEE
          </span>
          <h2 className="font-serif text-3xl font-normal leading-tight text-white sm:text-4xl">
            CRDT Edge Replication: Never drop a register transaction during fiber blackouts.
          </h2>
          <p className="font-sans text-base leading-relaxed text-[#a8cfbd]">
            Every Scryme POS terminal runs an embedded SQLite instance equipped with Conflict-free Replicated Data
            Types (CRDTs). When store internet fails, terminals continue scanning, ringing orders, taking offline card
            authorizations, and printing receipts without skipping a beat.
          </p>
          <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5 rounded-xl bg-[#12372a]/80 p-4">
              <span className="font-sans text-sm font-semibold text-[#bef529]">
                Local Cryptographic Queuing
              </span>
              <span className="font-sans text-xs text-[#e9e8e5]">
                Each invoice is assigned an immutable SHA-256 monotonic sequence hash signed with the terminal's hardware key.
              </span>
            </div>
            <div className="flex flex-col gap-1.5 rounded-xl bg-[#12372a]/80 p-4">
              <span className="font-sans text-sm font-semibold text-[#bef529]">
                Deterministic General Ledger Sync
              </span>
              <span className="font-sans text-xs text-[#e9e8e5]">
                Upon internet restoration, the queue streams directly to the core ERP with guaranteed idempotency and zero duplicate bookings.
              </span>
            </div>
          </div>
        </div>

        {/* Edge Architecture Visual Diagram */}
        <div className="flex w-full flex-col gap-4 rounded-2xl bg-[#12372a] p-6 font-mono text-xs shadow-xl lg:w-96">
          <div className="flex items-center justify-between border-b border-[#c1c8c3]/20 pb-2">
            <span className="font-bold text-[#bef529]">OFFLINE REPLICATION TOPOLOGY</span>
            <span className="rounded bg-[#4d6700] px-2 py-0.5 text-[10px] text-white">
              CONSENSUS OK
            </span>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-[#002116]/60 p-2.5">
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-[#bef529]" />
              <span>Terminal Lane 01</span>
            </div>
            <span className="font-bold text-[#bef529]">SQLITE CRDT</span>
          </div>

          <div className="flex justify-center text-xs text-[#a8cfbd]">↓ Local LAN Mesh (mDNS)</div>

          <div className="flex items-center justify-between rounded-lg bg-[#002116]/60 p-2.5">
            <div className="flex items-center gap-2">
              <RouterIcon className="h-4 w-4 text-[#bef529]" />
              <span>Store Edge Mini-Hub</span>
            </div>
            <span className="font-bold text-[#bef529]">CACHE RECONCILED</span>
          </div>

          <div className="flex justify-center text-xs text-[#a8cfbd]">↓ WAN Restored (TLS 1.3)</div>

          <div className="flex items-center justify-between rounded-lg bg-[#bef529] p-2.5 font-bold text-[var(--text-main)]">
            <div className="flex items-center gap-2">
              <Cloud className="h-4 w-4 text-[var(--text-main)]" />
              <span>Scryme Core ERP Kernel</span>
            </div>
            <span>ZERO DRIFT</span>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- 8. Quantitative Impact Metrics ---------- */

function PosImpactMetrics() {
  return (
    <section data-scroll-reveal="fade-in" className="w-full bg-[var(--bg-main)] px-4 py-16 md:px-8">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 md:grid-cols-3">
        <div className="flex flex-col gap-2 rounded-xl bg-[var(--bg-secondary)] p-6 shadow-sm">
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
            TRANSACTION SPEED
          </span>
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-4xl font-normal text-[var(--text-main)]">0.84s</span>
            <span className="font-sans text-xs font-semibold text-[#4d6700] dark:text-[#d2ff3a]">vs 4.2s Cloud Avg</span>
          </div>
          <p className="font-sans text-sm text-[var(--text-muted)]">
            P99 checkout latency benchmarked across 25,000 peak holiday transactions per flagship store.
          </p>
        </div>

        <div className="flex flex-col gap-2 rounded-xl bg-[var(--bg-secondary)] p-6 shadow-sm">
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
            AVAILABILITY SLA
          </span>
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-4xl font-normal text-[var(--text-main)]">100%</span>
            <span className="font-sans text-xs font-semibold text-[#4d6700] dark:text-[#d2ff3a]">Offline Capable</span>
          </div>
          <p className="font-sans text-sm text-[var(--text-muted)]">
            Zero lost sales caused by ISP interruptions, cloud outages, or regional DNS downtime.
          </p>
        </div>

        <div className="flex flex-col gap-2 rounded-xl bg-[var(--bg-secondary)] p-6 shadow-sm">
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
            LEDGER SYNCHRONIZATION
          </span>
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-4xl font-normal text-[var(--text-main)]">0.00s</span>
            <span className="font-sans text-xs font-semibold text-[#4d6700] dark:text-[#d2ff3a]">Real-Time Sync</span>
          </div>
          <p className="font-sans text-sm text-[var(--text-muted)]">
            Instant inventory decrement on in-store purchases ensures zero overselling on your Shopify or headless web
            storefronts.
          </p>
        </div>
      </div>
    </section>
  )
}

/* ---------- 9. Customer Case Study & Proof ---------- */

function PosCaseStudy() {
  return (
    <section data-scroll-reveal="fade-in" className="w-full bg-[var(--bg-secondary)] px-4 py-16 md:px-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-8 rounded-2xl bg-white p-6 shadow-md lg:flex-row lg:p-10">
        <div className="flex flex-col gap-6 lg:w-1/2">
          <div className="flex items-center gap-2">
            <span className="rounded bg-[#e3e2e0] px-2 py-0.5 font-mono text-[11px] font-bold text-[var(--text-main)]">
              CASE STUDY 2025
            </span>
            <span className="font-sans text-xs text-[var(--text-muted)]">
              Maison Verre Luxury Retail &amp; Dining
            </span>
          </div>
          <h2 className="font-serif text-3xl font-normal leading-tight text-[var(--text-main)]">
            How Maison Verre unified 42 boutique registers and 8 rooftop dining rooms onto a single Scryme POS kernel.
          </h2>
          <blockquote className="font-serif text-lg italic leading-snug text-[#1a1c1a]">
            “Our previous cloud POS locked up whenever Saturday crowds saturated the cellular towers on the
            Champs-Élysées. Scryme's local native execution erased checkout bottlenecks overnight while reducing our
            terminal hardware budget by 68%.”
          </blockquote>
          <div className="flex items-center gap-3 pt-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#002116] font-mono font-bold text-white">
              AL
            </div>
            <div>
              <div className="font-sans text-sm font-semibold text-[var(--text-main)]">Antoine Lefèvre</div>
              <div className="font-sans text-xs text-[var(--text-muted)]">
                Chief Technology Officer, Maison Verre Paris
              </div>
            </div>
          </div>
        </div>

        {/* Proof Metrics Grid */}
        <div className="grid w-full grid-cols-2 gap-4 lg:w-1/2">
          <div className="flex flex-col gap-1 rounded-xl bg-[var(--bg-secondary)] p-4">
            <span className="font-serif text-3xl font-normal text-[var(--text-main)]">-68%</span>
            <span className="font-sans text-sm font-semibold text-[var(--text-main)]">Hardware BOM Cost</span>
            <span className="font-sans text-xs text-[var(--text-muted)]">
              Switched from proprietary hardware to generic iPads &amp; Linux terminals.
            </span>
          </div>
          <div className="flex flex-col gap-1 rounded-xl bg-[var(--bg-secondary)] p-4">
            <span className="font-serif text-3xl font-normal text-[var(--text-main)]">+24%</span>
            <span className="font-sans text-sm font-semibold text-[var(--text-main)]">Checkout Velocity</span>
            <span className="font-sans text-xs text-[var(--text-muted)]">
              Faster EMV contact handshake and zero spool delays.
            </span>
          </div>
          <div className="flex flex-col gap-1 rounded-xl bg-[var(--bg-secondary)] p-4">
            <span className="font-serif text-3xl font-normal text-[var(--text-main)]">100%</span>
            <span className="font-sans text-sm font-semibold text-[var(--text-main)]">
              Omnichannel Visibility
            </span>
            <span className="font-sans text-xs text-[var(--text-muted)]">
              Real-time inventory decrement across Paris and e-commerce catalogs.
            </span>
          </div>
          <div className="flex flex-col gap-1 rounded-xl bg-[var(--bg-secondary)] p-4">
            <span className="font-serif text-3xl font-normal text-[var(--text-main)]">4.9/5</span>
            <span className="font-sans text-sm font-semibold text-[var(--text-main)]">
              Staff Usability Score
            </span>
            <span className="font-sans text-xs text-[var(--text-muted)]">
              Cashiers and servers fully onboarding in under 15 minutes.
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- 10. Architectural POS FAQ ---------- */

const POS_FAQS = [
  {
    q: 'How does Scryme communicate with local hardware peripherals without browser sandbox issues?',
    a: 'Because Scryme runs as a native desktop binary (via our Rust/Tauri desktop runtime), it possesses direct access to operating system USB HID drivers, raw serial COM ports, and local TCP sockets. It does not rely on fragile browser WebHID APIs or cloud print relays.',
  },
  {
    q: 'Is the terminal PCI-DSS compliant when handling offline transactions?',
    a: 'Yes. Scryme uses P2PE (Point-to-Point Encryption). Sensitive card data never touches the terminal memory in cleartext; payment pins and track data remain securely encrypted inside the secure enclave of the payment terminal (e.g. Ingenico/Adyen) and are stored in an offline tokenized format until connectivity returns.',
  },
  {
    q: 'Can we design custom ESC/POS thermal receipts with our brand typography and logos?',
    a: 'Absolutely. Our visual receipt templating engine allows you to upload high-contrast rasterized 1-bit monochrome logos, configure barcode formats (QR, Aztec, Code 128), and inject dynamic fiscal data variables according to regional tax authority standards (such as French NF525 or German TSE regulations).',
  },
  {
    q: 'What happens during a split payment when one card declines mid-transaction?',
    a: 'Scryme uses two-phase transactional commits. The original tender balance remains open with the approved portion securely logged, allowing the cashier to immediately choose an alternative tender (cash, gift card, or second credit card) without voiding or re-entering the entire order.',
  },
]

function PosFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section data-scroll-reveal="fade-in" className="w-full bg-[var(--bg-main)] px-4 py-16 md:px-8">
      <div className="mx-auto flex max-w-4xl flex-col gap-8">
        <div className="text-center">
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[var(--text-main)]">
            Frequently Addressed Inquiries
          </span>
          <h2 className="mt-1 font-serif text-3xl font-normal text-[var(--text-main)]">
            Enterprise Architecture &amp; Deployment FAQ
          </h2>
        </div>

        <div className="flex flex-col gap-3">
          {POS_FAQS.map((faq, i) => {
            const isOpen = openIndex === i
            return (
              <div
                key={faq.q}
                className="flex flex-col gap-2 rounded-xl bg-[var(--bg-secondary)] p-4 shadow-sm"
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="flex w-full cursor-pointer items-center justify-between text-left font-sans text-sm font-semibold text-[var(--text-main)]"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`h-5 w-5 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-[#4d6700] dark:text-[#d2ff3a]' : 'text-[var(--text-muted)]'
                    }`}
                  />
                </button>
                {isOpen && (
                  <p className="mt-2 border-t border-[#c1c8c3]/30 pt-2 font-sans text-sm leading-relaxed text-[var(--text-muted)]">
                    {faq.a}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ---------- 11. High-Impact Enterprise CTA Banner ---------- */

function PosCtaBanner() {
  return (
    <section data-scroll-reveal="fade-in" className="w-full bg-[#12372a] px-4 py-16 text-white md:px-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 rounded-2xl bg-[#002116] p-6 shadow-xl lg:flex-row lg:p-10">
        <div className="flex max-w-2xl flex-col gap-3">
          <span className="font-mono text-xs font-semibold uppercase tracking-widest text-[#bef529]">
            NEXT-GEN STORE REGISTER UPGRADE
          </span>
          <h2 className="font-serif text-3xl font-normal leading-tight text-white lg:text-4xl">
            Deploy the Scryme Unified POS Kernel across your entire store fleet.
          </h2>
          <p className="font-sans text-sm leading-relaxed text-[#a8cfbd]">
            Eliminate checkout lag, eliminate offline catastrophic failures, and unite your retail counters with
            unified ERP inventory intelligence in under two weeks.
          </p>
        </div>

        <div className="flex w-full flex-col items-center gap-3 sm:flex-row lg:w-auto">
          <a
            href="https://app.scryme.tech/signup?plan=scale&billing=annual&trial=true"
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#bef529] px-6 py-3.5 font-sans text-xs font-bold uppercase tracking-wider text-[#151f00] shadow-md transition-all hover:bg-[#a4d700] sm:w-auto"
          >
            <Store className="h-5 w-5" />
            Book In-Store Hardware Demo
          </a>
          <Link
            to="/pricing"
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#12372a] px-6 py-3.5 font-sans text-xs font-semibold uppercase tracking-wider text-white transition-all hover:bg-white/10 sm:w-auto"
          >
            <Terminal className="h-5 w-5" />
            Download Desktop SDK
          </Link>
        </div>
      </div>
    </section>
  )
}

/* ---------- Main Component Page ---------- */

function PointOfSaleComponent() {
  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] font-sans selection:bg-[#bef529] selection:text-[#151f00] transition-colors">
      <Header />
      <main className="w-full pt-20">
        <LivePosStrip />
        <PosHero />
        <TerminalCockpit />
        <IndustryVariants />
        <OsArchitectureMatrix />
        <HardwareEcosystem />
        <OfflineResilienceEngine />
        <PosImpactMetrics />
        <PosCaseStudy />
        <PosFaq />
        <PosCtaBanner />
      </main>
      <Footer />
    </div>
  )
}