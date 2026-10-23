import { createFileRoute, Link } from '@tanstack/react-router'
import { Header } from '../../components/Header'
import { Footer } from '../../components/Footer'
import {
  Smartphone,
  QrCode,
  WifiOff,
  Bell,
  ShieldCheck,
  Zap,
  CheckCircle2,
  ArrowRight,
  Clock,
  Users,
  Calendar,
  Check,
  RefreshCw,
  Layers,
  Cpu,
  Lock
} from 'lucide-react'
import { useState } from 'react'

export const Route = createFileRoute('/features/mobile')({
  component: MobileFeatureComponent,
})

function MobileFeatureComponent() {
  const [activeTab, setActiveTab] = useState<'pairing' | 'tasks' | 'schedule' | 'security'>('pairing')
  const [isSimulatingScan, setIsSimulatingScan] = useState(false)
  const [scannedItem, setScannedItem] = useState<{ sku: string; name: string; qty: number } | null>({
    sku: 'SKU-8924-ALUM',
    name: 'Aluminum Sheet Coil 2mm',
    qty: 150
  })

  const handleSimulateScan = () => {
    setIsSimulatingScan(true)
    setTimeout(() => {
      setIsSimulatingScan(false)
      setScannedItem({
        sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}-OPTIC`,
        name: 'Precision Fiber Optic Module',
        qty: Math.floor(10 + Math.random() * 90)
      })
    }, 700)
  }

  return (
    <div className="theme-editorial min-h-screen bg-[#faf9f6] text-[#1a1c1a] font-sans selection:bg-[#bef529] selection:text-[#12372a]">
      <Header />

      {/* Top Mobile Status Ticker */}
      <div className="w-full bg-[#f4f3f0] border-b border-[rgba(18,55,42,0.08)] py-2 px-4 text-data-mono text-[#414844] flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#12372a] text-[#bef529] font-bold text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#bef529] animate-pulse" />
            ANDROID ENTERPRISE APP v3.4.0
          </span>
          <span className="hidden sm:inline text-[#717974]">CLEAN ARCHITECTURE • HILT DI</span>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-[#5f6662]">
          <span>⚡ ML Kit Scan: <strong className="text-[#12372a]">&lt; 200ms</strong></span>
          <span>💾 Offline Engine: <strong className="text-[#12372a]">Local Room / SQLite</strong></span>
          <span>🔔 Push Engine: <strong className="text-[#12372a]">FCM Direct Channel</strong></span>
        </div>
      </div>

      {/* Hero Section */}
      <section className="pt-12 pb-16 md:pt-20 md:pb-24 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

          {/* Left Column: Headlines */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#e9e8e5] border border-[rgba(18,55,42,0.1)] text-label-xs text-[#12372a]">
              <Smartphone className="w-3.5 h-3.5 text-[#4d6700]" />
              Android Native Clean Architecture & Field Operations
            </div>

            <h1 className="text-display-xl text-[#002116] leading-tight">
              Enterprise Field Telemetry & POS Pairing in the Palm of Your Hand.
            </h1>

            <p className="text-body-lg text-[#414844] max-w-xl">
              Equip floor personnel, field engineers, and store managers with high-fidelity Kotlin native applications. Featuring CameraX barcode scanning, offline SQLite transactional queueing, FCM push alerts, and automated shift scheduling.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <a
                href="https://app.scryme.tech/signup"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#12372a] text-[#ffffff] font-semibold text-sm rounded-md hover:bg-[#002116] transition shadow-sm"
              >
                <span>Deploy Mobile Workspace</span>
                <ArrowRight className="w-4 h-4 text-[#bef529]" />
              </a>
              <a
                href="#mobile-sandbox"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#ffffff] border border-[rgba(18,55,42,0.18)] text-[#12372a] font-semibold text-sm rounded-md hover:bg-[#f4f3f0] transition"
              >
                <span>Explore App Architecture</span>
              </a>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-6 text-label-xs text-[#5f6662]">
              <span>✓ Jetpack Compose UI</span>
              <span>✓ CameraX ML Kit Engine</span>
              <span>✓ Local DataStore Session</span>
              <span>✓ Self-Signed SSL Trust</span>
            </div>
          </div>

          {/* Right Column: Interactive Android Phone Mockup Frame */}
          <div className="lg:col-span-6 flex justify-center">
            <div className="w-full max-w-sm ee-card-level3 bg-[#12372a] text-[#ffffff] p-5 rounded-2xl border-4 border-[#e3e2e0] shadow-2xl space-y-4">
              {/* Phone Status Bar */}
              <div className="flex items-center justify-between text-[11px] font-mono text-[#7ba190] pb-2 border-b border-[rgba(255,255,255,0.12)]">
                <span>09:41 AM</span>
                <span className="flex items-center gap-1.5 text-[#bef529]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#bef529] animate-pulse" />
                  SCRYME MOBILE v3
                </span>
                <span>100% 🔋</span>
              </div>

              {/* App Screen Header */}
              <div className="bg-[#002116] p-3 rounded-lg border border-[rgba(255,255,255,0.08)] flex items-center justify-between">
                <div>
                  <h4 className="text-title-sm text-[#ffffff]">Rotterdam Logistics Hub</h4>
                  <p className="text-[10px] text-[#70a487] font-mono">ORG: scryme-eu-central</p>
                </div>
                <span className="px-2 py-0.5 bg-[#bef529] text-[#12372a] text-[10px] font-bold rounded">
                  ONLINE
                </span>
              </div>

              {/* Scanner Action Box */}
              <div className="bg-[#003923] p-4 rounded-lg border border-[rgba(255,255,255,0.1)] space-y-3">
                <div className="flex items-center justify-between text-xs text-[#bef529] font-bold">
                  <span className="flex items-center gap-1.5">
                    <QrCode className="w-4 h-4" />
                    CameraX ML Kit Scanner
                  </span>
                  <span className="text-[10px] text-[#70a487]">Latency: 18ms</span>
                </div>

                <div className="bg-[#002116] p-3 rounded text-data-mono text-xs text-[#a8cfbd] space-y-1">
                  <p className="text-[#70a487]">SCANNED ITEM DATA:</p>
                  <p className="font-bold text-[#ffffff]">{scannedItem?.name}</p>
                  <div className="flex justify-between text-[11px] pt-1 border-t border-[rgba(255,255,255,0.08)]">
                    <span>SKU: {scannedItem?.sku}</span>
                    <span className="text-[#bef529]">Qty: {scannedItem?.qty}</span>
                  </div>
                </div>

                <button
                  onClick={handleSimulateScan}
                  disabled={isSimulatingScan}
                  className="w-full py-2 bg-[#bef529] hover:bg-[#a4d700] text-[#151f00] text-xs font-bold uppercase tracking-wider rounded transition flex items-center justify-center gap-2"
                >
                  <QrCode className={`w-3.5 h-3.5 ${isSimulatingScan ? 'animate-spin' : ''}`} />
                  <span>{isSimulatingScan ? 'Scanning Barcode...' : 'Simulate CameraX Scan'}</span>
                </button>
              </div>

              {/* Active Mobile Workflows Preview */}
              <div className="space-y-2 text-xs">
                <div className="p-2.5 bg-[#002116] rounded border border-[rgba(255,255,255,0.08)] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-[#bef529]" />
                    <span>Active Shift: 08:00 - 16:00</span>
                  </div>
                  <span className="text-[10px] text-[#70a487]">Verified</span>
                </div>

                <div className="p-2.5 bg-[#002116] rounded border border-[rgba(255,255,255,0.08)] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-3.5 h-3.5 text-[#bef529]" />
                    <span>FCM Alert: High Stock Priority</span>
                  </div>
                  <span className="text-[10px] text-[#bef529]">Just Now</span>
                </div>
              </div>

              {/* Bottom Nav Simulation Bar */}
              <div className="grid grid-cols-4 gap-1 pt-2 border-t border-[rgba(255,255,255,0.1)] text-center text-[10px] text-[#70a487]">
                <div className="p-1 text-[#bef529] font-bold">Tasks</div>
                <div className="p-1">Schedule</div>
                <div className="p-1">Admin</div>
                <div className="p-1">Profile</div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 4 Core Pillars of Android Infrastructure */}
      <section className="py-16 px-4 md:px-8 max-w-7xl mx-auto border-t border-[rgba(18,55,42,0.08)]">
        <div className="text-left mb-12">
          <span className="text-label-xs text-[#416656]">MOBILE INFRASTRUCTURE</span>
          <h2 className="text-headline-lg text-[#002116] mt-1">
            Engineered for low-latency field execution and harsh environments.
          </h2>
          <p className="text-body-md text-[#414844] mt-2 max-w-3xl">
            Built using modern Kotlin Clean Architecture, Hilt dependency injection, and Retrofit HTTP interceptors. Designed to withstand network loss in warehouse basements while maintaining ledger fidelity.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="ee-card-level1 p-6 space-y-4 hover:border-[rgba(18,55,42,0.2)] transition">
            <div className="w-10 h-10 rounded bg-[#efeeeb] flex items-center justify-center text-[#12372a]">
              <QrCode className="w-5 h-5" />
            </div>
            <h3 className="text-title-md text-[#002116]">CameraX & ML Kit Barcode Engine</h3>
            <p className="text-body-sm text-[#414844]">
              Hardware-accelerated optical scanning. Decodes 1D barcodes, 2D QR codes, and DataMatrix labels in sub-200ms under low light or damaged label conditions.
            </p>
            <div className="pt-2 text-label-xs text-[#416656] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#12372a]" />
              Instant Hardware Decode
            </div>
          </div>

          <div className="ee-card-level1 p-6 space-y-4 hover:border-[rgba(18,55,42,0.2)] transition">
            <div className="w-10 h-10 rounded bg-[#efeeeb] flex items-center justify-center text-[#12372a]">
              <WifiOff className="w-5 h-5" />
            </div>
            <h3 className="text-title-md text-[#002116]">Offline SQLite Queue & Sync</h3>
            <p className="text-body-sm text-[#414844]">
              Never halt operations during cellular dead zones. All inventory transactions and order dockets queue locally in SQLite, syncing automatically with NestJS V3 upon reconnect.
            </p>
            <div className="pt-2 text-label-xs text-[#416656] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#12372a]" />
              Zero Data Loss
            </div>
          </div>

          <div className="ee-card-level1 p-6 space-y-4 hover:border-[rgba(18,55,42,0.2)] transition">
            <div className="w-10 h-10 rounded bg-[#efeeeb] flex items-center justify-center text-[#12372a]">
              <Bell className="w-5 h-5" />
            </div>
            <h3 className="text-title-md text-[#002116]">FCM Push Notifications</h3>
            <p className="text-body-sm text-[#414844]">
              Direct Firebase Cloud Messaging channels. Receive urgent stock depletion alerts, shift schedule updates, and high-value sales approvals directly on mobile lock screens.
            </p>
            <div className="pt-2 text-label-xs text-[#416656] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#12372a]" />
              Sub-Second Alerting
            </div>
          </div>

          <div className="ee-card-level1 p-6 space-y-4 hover:border-[rgba(18,55,42,0.2)] transition">
            <div className="w-10 h-10 rounded bg-[#efeeeb] flex items-center justify-center text-[#12372a]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-title-md text-[#002116]">mTLS & POS Terminal Pairing</h3>
            <p className="text-body-sm text-[#414844]">
              Pair mobile devices seamlessly with Tauri desktop POS hardware via secure pairing sessions (`/v3/pos/pairing/session/:sessionId/authorize`) and self-signed SSL trust stores.
            </p>
            <div className="pt-2 text-label-xs text-[#416656] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#12372a]" />
              Encrypted Session Pairing
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Mobile Feature Simulator */}
      <section id="mobile-sandbox" className="py-16 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="ee-card-level2 bg-[#ffffff] p-6 md:p-8 rounded-lg border border-[rgba(18,55,42,0.12)]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[rgba(18,55,42,0.08)]">
            <div>
              <span className="text-label-xs text-[#416656]">MOBILE MODULE RUNTIME</span>
              <h2 className="text-headline-md text-[#002116]">Inspect Android Native Workflows</h2>
              <p className="text-body-sm text-[#414844] mt-1">
                Explore the core modules implemented in Clean Architecture: POS Pairing, Task Execution, Schedule Management, and Security Trust Stores.
              </p>
            </div>
          </div>

          {/* Module Switcher Tabs */}
          <div className="flex flex-wrap items-center gap-2 my-6">
            <button
              onClick={() => setActiveTab('pairing')}
              className={`px-4 py-2 rounded text-label-xs transition ${
                activeTab === 'pairing'
                  ? 'bg-[#12372a] text-[#ffffff] font-bold'
                  : 'bg-[#efeeeb] text-[#414844] hover:bg-[#e3e2e0]'
              }`}
            >
              POS Terminal Pairing
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`px-4 py-2 rounded text-label-xs transition ${
                activeTab === 'tasks'
                  ? 'bg-[#12372a] text-[#ffffff] font-bold'
                  : 'bg-[#efeeeb] text-[#414844] hover:bg-[#e3e2e0]'
              }`}
            >
              Tasks & Member Selection
            </button>
            <button
              onClick={() => setActiveTab('schedule')}
              className={`px-4 py-2 rounded text-label-xs transition ${
                activeTab === 'schedule'
                  ? 'bg-[#12372a] text-[#ffffff] font-bold'
                  : 'bg-[#efeeeb] text-[#414844] hover:bg-[#e3e2e0]'
              }`}
            >
              Schedule & Attendance
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`px-4 py-2 rounded text-label-xs transition ${
                activeTab === 'security'
                  ? 'bg-[#12372a] text-[#ffffff] font-bold'
                  : 'bg-[#efeeeb] text-[#414844] hover:bg-[#e3e2e0]'
              }`}
            >
              Security & SSL Trust Store
            </button>
          </div>

          {/* Tab Detail Display */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center bg-[#f4f3f0] p-6 rounded-lg border border-[rgba(18,55,42,0.08)]">
            {activeTab === 'pairing' && (
              <>
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[#12372a] text-[#bef529] font-mono text-[11px]">
                    POST /v3/:orgSlug/pos/pair
                  </div>
                  <h3 className="text-headline-sm text-[#002116]">CameraX QR Barcode POS Pairing</h3>
                  <p className="text-body-sm text-[#414844]">
                    Mobile devices scan a dynamically generated QR code on the desktop Tauri POS app. The Android device transmits authorization session credentials to authorize the tablet/phone as an active POS terminal.
                  </p>
                  <ul className="space-y-2 text-body-sm text-[#414844]">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#4d6700]" /> Hardware pairing session token exchange
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#4d6700]" /> Automatic branch location binding (`x-location-id`)
                    </li>
                  </ul>
                </div>
                <div className="bg-[#002116] text-[#ffffff] p-5 rounded font-mono text-data-mono text-xs border border-[rgba(18,55,42,0.2)]">
                  <p className="text-[#bef529]">// Android Pairing Interceptor</p>
                  <p className="text-[#a8cfbd]">val sessionId = "pos_pair_9921482"</p>
                  <p className="text-[#a8cfbd]">val response = posApiService.authorizeSession(</p>
                  <p className="pl-4 text-[#a8cfbd]">sessionId = sessionId,</p>
                  <p className="pl-4 text-[#a8cfbd]">deviceKey = sessionManager.getDeviceKey()</p>
                  <p className="text-[#a8cfbd] font-bold text-[#bef529]">) // Returns Status: AUTHORIZED</p>
                </div>
              </>
            )}

            {activeTab === 'tasks' && (
              <>
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[#12372a] text-[#bef529] font-mono text-[11px]">
                    MemberDropdown & FormComponents
                  </div>
                  <h3 className="text-headline-sm text-[#002116]">Task Execution & Member Assignment</h3>
                  <p className="text-body-sm text-[#414844]">
                    Standardized Material 3 Jetpack Compose UI components (`tech.scryme.app.ui.components.FormComponents`) enable team leaders to delegate tasks, select staff members via avatar dropdowns, and track completion.
                  </p>
                  <ul className="space-y-2 text-body-sm text-[#414844]">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#4d6700]" /> Coil image loading with fallback avatars
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#4d6700]" /> Member ID and User ID dual resolution
                    </li>
                  </ul>
                </div>
                <div className="bg-[#002116] text-[#ffffff] p-5 rounded font-mono text-data-mono text-xs border border-[rgba(18,55,42,0.2)]">
                  <p className="text-[#bef529]">// FormComponents.kt - MemberDropdown</p>
                  <p className="text-[#a8cfbd]">ExposedDropdownMenuBox(</p>
                  <p className="pl-4 text-[#a8cfbd]">expanded = expanded,</p>
                  <p className="pl-4 text-[#a8cfbd]">onExpandedChange = {'{ expanded = !expanded }'}</p>
                  <p className="text-[#a8cfbd]">) {'{'}</p>
                  <p className="pl-4 text-[#a8cfbd]">MemberAvatar(member = selectedMember)</p>
                  <p className="text-[#a8cfbd]">{'}'}</p>
                </div>
              </>
            )}

            {activeTab === 'schedule' && (
              <>
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[#12372a] text-[#bef529] font-mono text-[11px]">
                    DatePickerTextField & ScheduleScreen
                  </div>
                  <h3 className="text-headline-sm text-[#002116]">Shift Schedule & Attendance Rostering</h3>
                  <p className="text-body-sm text-[#414844]">
                    Integrated Material 3 `DatePickerDialog` and shift management interfaces keep store employees synchronized across all time zones and branch locations.
                  </p>
                </div>
                <div className="bg-[#002116] text-[#ffffff] p-5 rounded font-mono text-data-mono text-xs border border-[rgba(18,55,42,0.2)]">
                  <p className="text-[#bef529]">// ScheduleApiService.kt</p>
                  <p className="text-[#a8cfbd]">@GET("schedule/shifts")</p>
                  <p className="text-[#a8cfbd]">suspend fun getShifts(</p>
                  <p className="pl-4 text-[#a8cfbd]">@Header("x-location-id") locationId: String,</p>
                  <p className="pl-4 text-[#a8cfbd]">@Query("date") date: String</p>
                  <p className="text-[#a8cfbd]">): Response&lt;List&lt;ShiftDto&gt;&gt;</p>
                </div>
              </>
            )}

            {activeTab === 'security' && (
              <>
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[#12372a] text-[#bef529] font-mono text-[11px]">
                    NetworkModule.kt & network_security_config.xml
                  </div>
                  <h3 className="text-headline-sm text-[#002116]">Self-Signed SSL Trust & Interceptors</h3>
                  <p className="text-body-sm text-[#414844]">
                    The Android OkHttp client is configured with custom trust managers to allow seamless communication with local edge servers and self-signed SSL certificates in private enterprise deployments.
                  </p>
                </div>
                <div className="bg-[#002116] text-[#ffffff] p-5 rounded font-mono text-data-mono text-xs border border-[rgba(18,55,42,0.2)]">
                  <p className="text-[#bef529]">// HeaderInterceptor.kt</p>
                  <p className="text-[#a8cfbd]">builder.addHeader("Authorization", "Bearer " + token)</p>
                  <p className="text-[#a8cfbd]">builder.addHeader("x-org-slug", orgSlug)</p>
                  <p className="text-[#a8cfbd]">builder.addHeader("x-location-id", locationId)</p>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Enterprise Mobile Metrics */}
      <section className="py-12 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="ee-card-level1 p-8 space-y-2">
            <div className="text-display-xl text-[#002116] font-serif">&lt; 0.2s</div>
            <h4 className="text-title-sm text-[#002116]">CameraX Barcode Latency</h4>
            <p className="text-body-sm text-[#5f6662]">
              Instant optical label processing with automatic focus, contrast correction, and multi-format decoding.
            </p>
          </div>

          <div className="ee-card-level1 p-8 space-y-2">
            <div className="text-display-xl text-[#12372a] font-serif">100%</div>
            <h4 className="text-title-sm text-[#002116]">Offline Operational Continuity</h4>
            <p className="text-body-sm text-[#5f6662]">
              Store operations continue uninterrupted during network outages, syncing automatically upon network restoration.
            </p>
          </div>

          <div className="ee-card-level1 p-8 space-y-2">
            <div className="text-display-xl text-[#4d6700] font-serif">10,000+</div>
            <h4 className="text-title-sm text-[#002116]">Active Field Devices Supported</h4>
            <p className="text-body-sm text-[#5f6662]">
              Scales across global logistics fleets, retail branch networks, and commercial bakery production lines.
            </p>
          </div>
        </div>
      </section>

      {/* Call To Action Banner */}
      <section className="py-16 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="bg-[#12372a] text-[#ffffff] p-10 md:p-16 rounded-lg text-center relative overflow-hidden space-y-6">
          <h2 className="text-display-xl text-[#ffffff] max-w-3xl mx-auto">
            Ready to deploy Scryme Mobile to your field teams?
          </h2>

          <p className="text-body-lg text-[#a8cfbd] max-w-2xl mx-auto">
            Download the Android Enterprise APK or deploy via Google Play Private Channel in under 5 minutes.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <a
              href="https://app.scryme.tech/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#bef529] hover:bg-[#a4d700] text-[#151f00] font-bold text-sm uppercase tracking-wider rounded-md transition shadow-md"
            >
              <span>Get Started with Scryme Mobile</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
