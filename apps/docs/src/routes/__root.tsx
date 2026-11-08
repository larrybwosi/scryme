import { createRootRoute, HeadContent, Link, Outlet, Scripts, useRouterState } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import {
  Search,
  BookOpen,
  Bot,
  Box,
  Code2,
  Bell,
  Plug,
  Wallet,
  Gauge,
  ShieldCheck,
  FileText,
  HelpCircle,
  Headphones,
  ChevronRight,
  ExternalLink,
  ChevronDown,
  X,
  Play,
  Layers,
  Package,
  Boxes,
  Truck,
  Tag,
  DollarSign,
  Archive,
  FileSpreadsheet,
  PackageCheck,
  AlertOctagon
} from 'lucide-react'
import '../styles/app.css'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Scryme Developer Docs & V3 API Reference' },
      { name: 'description', content: 'Official developer documentation and API reference for Scryme enterprise ERP, POS, and inventory.' }
    ]
  }),
  component: RootComponent
})

function RootComponent() {
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Track active route to auto-expand relevant accordion sections
  const routerState = useRouterState()
  const currentPath = routerState.location.pathname

  const isInventoryActive = currentPath.startsWith('/docs/inventory') || currentPath === '/docs/inventory-lifecycle'
  const isStockingActive = currentPath.startsWith('/docs/stocking')
  const isApiActive = currentPath.startsWith('/api-reference')

  const [inventoryExpanded, setInventoryExpanded] = useState(true)
  const [stockingExpanded, setStockingExpanded] = useState(true)
  const [apiExpanded, setApiExpanded] = useState(false)

  // Auto-expand when navigating
  useEffect(() => {
    if (isInventoryActive) setInventoryExpanded(true)
    if (isStockingActive) setStockingExpanded(true)
    if (isApiActive) setApiExpanded(true)
  }, [isInventoryActive, isStockingActive, isApiActive])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(prev => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const inventorySubItems = [
    { label: 'Lifecycle Overview', to: '/docs/inventory-lifecycle' as const, icon: Boxes },
    { label: 'Create Products', to: '/docs/inventory/create-product' as const, icon: Tag },
    { label: 'Manage Variants & Scanners', to: '/docs/inventory/manage-variants' as const, icon: Layers },
    { label: 'Pricing & Multi-Units', to: '/docs/inventory/update-and-pricing' as const, icon: DollarSign },
    { label: 'Archive & Restore', to: '/docs/inventory/archive-and-restore' as const, icon: Archive },
  ]

  const stockingSubItems = [
    { label: 'Stocking Overview', to: '/docs/stocking' as const, icon: Boxes },
    { label: 'Inter-Location Transfers', to: '/docs/stocking/transfers' as const, icon: Truck },
    { label: 'Physical Reconciliation', to: '/docs/stocking/reconciliation' as const, icon: FileSpreadsheet },
    { label: 'PO Receiving & Batches', to: '/docs/stocking/reception' as const, icon: PackageCheck },
    { label: 'Waste & Adjustments', to: '/docs/stocking/adjustments' as const, icon: AlertOctagon },
  ]

  const apiSubItems = [
    { label: 'API Overview', to: '/api-reference' as const, icon: Code2 },
    { label: 'POS & Sales API', to: '/api-reference/pos' as const, icon: Tag },
    { label: 'Stocking & Inventory API', to: '/api-reference/stocking' as const, icon: Package },
    { label: 'Interactive Playground', to: '/api-reference/playground' as const, icon: Play },
  ]

  const searchResults = [
    { title: 'Getting Started', category: 'Guide', to: '/docs/getting-started' },
    { title: 'Installation and SDK Setup', category: 'Guide', to: '/docs/installation' },
    { title: 'Core Platform Concepts', category: 'Guide', to: '/docs/core-concepts' },
    { title: 'Inventory & Variant Lifecycle', category: 'Inventory', to: '/docs/inventory-lifecycle' },
    { title: 'Create Products & Initial Stock', category: 'Inventory', to: '/docs/inventory/create-product' },
    { title: 'Manage Variants & Hardware Scanners', category: 'Inventory', to: '/docs/inventory/manage-variants' },
    { title: 'Details & Multi-Unit Pricing', category: 'Inventory', to: '/docs/inventory/update-and-pricing' },
    { title: 'Archiving, Disabling & Restoring', category: 'Inventory', to: '/docs/inventory/archive-and-restore' },
    { title: 'Stocking Operations Overview', category: 'Stocking', to: '/docs/stocking' },
    { title: 'Inter-Location Stock Transfers', category: 'Stocking', to: '/docs/stocking/transfers' },
    { title: 'Physical Stocktaking & Reconciliation', category: 'Stocking', to: '/docs/stocking/reconciliation' },
    { title: 'Receiving Purchase Orders & Batches', category: 'Stocking', to: '/docs/stocking/reception' },
    { title: 'Waste Tracking & Manual Adjustments', category: 'Stocking', to: '/docs/stocking/adjustments' },
    { title: 'POS & Sales API', category: 'API Reference', to: '/api-reference/pos' },
    { title: 'Stocking & Inventory API', category: 'API Reference', to: '/api-reference/stocking' },
    { title: 'Interactive API Playground', category: 'API Reference', to: '/api-reference/playground' },
    { title: 'Security Best Practices', category: 'Guide', to: '/docs/security' },
    { title: 'Webhooks & Event Streams', category: 'Guide', to: '/docs/webhooks' },
    { title: 'Model Context Protocol (MCP)', category: 'Guide', to: '/docs/mcp' },
    { title: 'Third-Party Integrations', category: 'Guide', to: '/docs/integrations' },
    { title: 'M-Pesa Payment Integration', category: 'Guide', to: '/docs/integrations/mpesa' },
    { title: 'API Rate Limits', category: 'Guide', to: '/docs/rate-limits' },
    { title: 'Release Changelog', category: 'General', to: '/docs/changelog' },
    { title: 'Frequently Asked Questions', category: 'General', to: '/docs/faq' },
    { title: 'Developer Support', category: 'General', to: '/docs/support' },
  ].filter(r => r.title.toLowerCase().includes(searchQuery.toLowerCase()) || r.category.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="bg-slate-100 text-slate-900 min-h-screen font-sans antialiased">
        <div className="flex min-h-screen">
          <aside className="w-64 bg-slate-50 border-r border-slate-200 flex flex-col justify-between p-4 shrink-0 fixed top-0 bottom-0 left-0 overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-2 rounded-xl border border-slate-200 bg-white shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center font-bold text-sm">
                    <Box className="w-5 h-5" />
                  </div>
                  <div>
                    <h1 className="font-semibold text-sm leading-tight text-slate-900">Scryme Docs</h1>
                    <span className="text-xs text-slate-500">v3.0.0</span>
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </div>

              <button
                onClick={() => setSearchOpen(true)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs text-slate-500 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-colors shadow-2xs"
              >
                <div className="flex items-center gap-2">
                  <Search className="w-3.5 h-3.5 text-slate-400" />
                  <span>Search</span>
                </div>
                <kbd className="px-1.5 py-0.5 text-[10px] bg-slate-100 text-slate-500 rounded border border-slate-200">
                  ⌘K
                </kbd>
              </button>

              <div className="space-y-0.5 border-b border-slate-200 pb-3">
                <Link
                  to="/"
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-200/60 transition-colors"
                  activeProps={{ className: 'bg-slate-200/80 text-slate-900 font-semibold' }}
                >
                  <BookOpen className="w-4 h-4 text-slate-500" />
                  Documentation
                </Link>
                <Link
                  to="/docs/getting-started"
                  className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-200/60 transition-colors"
                  activeProps={{ className: 'bg-slate-200 text-slate-900 font-semibold' }}
                >
                  <div className="flex items-center gap-2.5">
                    <Box className="w-4 h-4 text-slate-500" />
                    Platform Overview
                  </div>
                </Link>
                <a
                  href="https://github.com/larrybwosi/scryme"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-200/60 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Code2 className="w-4 h-4 text-slate-500" />
                    GitHub
                  </div>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              </div>

              {/* Navigation Sections */}
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3">
                  Core Guides
                </span>
                <nav className="space-y-0.5 pt-1">
                  <Link
                    to="/docs/getting-started"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-slate-600 hover:bg-slate-200/60 hover:text-slate-900 transition-colors"
                    activeProps={{ className: 'bg-slate-200 text-slate-900 font-semibold' }}
                  >
                    <Play className="w-4 h-4 text-slate-400" />
                    <span>Getting Started</span>
                  </Link>

                  <Link
                    to="/docs/installation"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-slate-600 hover:bg-slate-200/60 hover:text-slate-900 transition-colors"
                    activeProps={{ className: 'bg-slate-200 text-slate-900 font-semibold' }}
                  >
                    <Package className="w-4 h-4 text-slate-400" />
                    <span>Installation</span>
                  </Link>

                  <Link
                    to="/docs/core-concepts"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-slate-600 hover:bg-slate-200/60 hover:text-slate-900 transition-colors"
                    activeProps={{ className: 'bg-slate-200 text-slate-900 font-semibold' }}
                  >
                    <BookOpen className="w-4 h-4 text-slate-400" />
                    <span>Core Concepts</span>
                  </Link>

                  <Link
                    to="/docs/components"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-slate-600 hover:bg-slate-200/60 hover:text-slate-900 transition-colors"
                    activeProps={{ className: 'bg-slate-200 text-slate-900 font-semibold' }}
                  >
                    <Layers className="w-4 h-4 text-slate-400" />
                    <span>Components</span>
                  </Link>
                </nav>
              </div>

              {/* Expandable Section 1: Inventory & Variants */}
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3">
                  Catalog & Logistics
                </span>
                <nav className="space-y-0.5 pt-1">
                  <div>
                    <div
                      className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer ${
                        isInventoryActive
                          ? 'bg-slate-200/70 text-slate-900 font-semibold'
                          : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
                      }`}
                      onClick={() => setInventoryExpanded(prev => !prev)}
                    >
                      <Link
                        to="/docs/inventory-lifecycle"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-2.5 flex-1"
                      >
                        <Boxes className="w-4 h-4 text-emerald-600" />
                        <span>Inventory & Variants</span>
                      </Link>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setInventoryExpanded(prev => !prev)
                        }}
                        className="p-0.5 hover:bg-slate-300/60 rounded"
                        aria-label="Toggle Inventory sub-menu"
                      >
                        <ChevronRight
                          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                            inventoryExpanded ? 'rotate-90' : ''
                          }`}
                        />
                      </button>
                    </div>

                    {inventoryExpanded && (
                      <div className="pl-6 pr-1 pt-1 space-y-0.5 border-l border-slate-200 ml-5 my-0.5">
                        {inventorySubItems.map((sub) => {
                          const SubIcon = sub.icon
                          return (
                            <Link
                              key={sub.to}
                              to={sub.to}
                              className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[11px] text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 transition-colors"
                              activeProps={{ className: 'text-emerald-700 bg-emerald-50/80 font-semibold' }}
                            >
                              <SubIcon className="w-3 h-3 text-slate-400" />
                              <span>{sub.label}</span>
                            </Link>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {/* Expandable Section 2: Stocking Operations */}
                  <div>
                    <div
                      className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer ${
                        isStockingActive
                          ? 'bg-slate-200/70 text-slate-900 font-semibold'
                          : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
                      }`}
                      onClick={() => setStockingExpanded(prev => !prev)}
                    >
                      <Link
                        to="/docs/stocking"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-2.5 flex-1"
                      >
                        <Truck className="w-4 h-4 text-blue-600" />
                        <span>Stocking Operations</span>
                      </Link>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setStockingExpanded(prev => !prev)
                        }}
                        className="p-0.5 hover:bg-slate-300/60 rounded"
                        aria-label="Toggle Stocking sub-menu"
                      >
                        <ChevronRight
                          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                            stockingExpanded ? 'rotate-90' : ''
                          }`}
                        />
                      </button>
                    </div>

                    {stockingExpanded && (
                      <div className="pl-6 pr-1 pt-1 space-y-0.5 border-l border-slate-200 ml-5 my-0.5">
                        {stockingSubItems.map((sub) => {
                          const SubIcon = sub.icon
                          return (
                            <Link
                              key={sub.to}
                              to={sub.to}
                              className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[11px] text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 transition-colors"
                              activeProps={{ className: 'text-blue-700 bg-blue-50/80 font-semibold' }}
                            >
                              <SubIcon className="w-3 h-3 text-slate-400" />
                              <span>{sub.label}</span>
                            </Link>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </nav>
              </div>

              {/* Expandable Section 3: API Reference */}
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3">
                  API Reference
                </span>
                <nav className="space-y-0.5 pt-1">
                  <div>
                    <div
                      className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer ${
                        isApiActive
                          ? 'bg-slate-200/70 text-slate-900 font-semibold'
                          : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
                      }`}
                      onClick={() => setApiExpanded(prev => !prev)}
                    >
                      <Link
                        to="/api-reference"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-2.5 flex-1"
                      >
                        <Code2 className="w-4 h-4 text-purple-600" />
                        <span>V3 REST Modules</span>
                      </Link>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setApiExpanded(prev => !prev)
                        }}
                        className="p-0.5 hover:bg-slate-300/60 rounded"
                        aria-label="Toggle API sub-menu"
                      >
                        <ChevronRight
                          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                            apiExpanded ? 'rotate-90' : ''
                          }`}
                        />
                      </button>
                    </div>

                    {apiExpanded && (
                      <div className="pl-6 pr-1 pt-1 space-y-0.5 border-l border-slate-200 ml-5 my-0.5">
                        {apiSubItems.map((sub) => {
                          const SubIcon = sub.icon
                          return (
                            <Link
                              key={sub.to}
                              to={sub.to}
                              className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[11px] text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 transition-colors"
                              activeProps={{ className: 'text-purple-700 bg-purple-50/80 font-semibold' }}
                            >
                              <SubIcon className="w-3 h-3 text-slate-400" />
                              <span>{sub.label}</span>
                            </Link>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </nav>
              </div>

              {/* General Reference Section */}
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3">
                  Integration & Operations
                </span>
                <nav className="space-y-0.5 pt-1">
                  <Link
                    to="/docs/webhooks"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-slate-600 hover:bg-slate-200/60 hover:text-slate-900 transition-colors"
                    activeProps={{ className: 'bg-slate-200 text-slate-900 font-semibold' }}
                  >
                    <Bell className="w-4 h-4 text-slate-400" />
                    <span>Webhooks</span>
                  </Link>

                  <Link
                    to="/docs/mcp"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-slate-600 hover:bg-slate-200/60 hover:text-slate-900 transition-colors"
                    activeProps={{ className: 'bg-slate-200 text-slate-900 font-semibold' }}
                  >
                    <Bot className="w-4 h-4 text-slate-400" />
                    <span>Model Context Protocol</span>
                  </Link>

                  <Link
                    to="/docs/integrations"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-slate-600 hover:bg-slate-200/60 hover:text-slate-900 transition-colors"
                    activeProps={{ className: 'bg-slate-200 text-slate-900 font-semibold' }}
                  >
                    <Plug className="w-4 h-4 text-slate-400" />
                    <span>Integrations</span>
                  </Link>

                  <Link
                    to="/docs/integrations/mpesa"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-slate-600 hover:bg-slate-200/60 hover:text-slate-900 transition-colors ml-2 border-l border-slate-200 pl-3"
                    activeProps={{ className: 'bg-slate-200 text-slate-900 font-semibold' }}
                  >
                    <Wallet className="w-4 h-4 text-emerald-600" />
                    <span>M-Pesa Setup</span>
                  </Link>

                  <Link
                    to="/docs/rate-limits"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-slate-600 hover:bg-slate-200/60 hover:text-slate-900 transition-colors"
                    activeProps={{ className: 'bg-slate-200 text-slate-900 font-semibold' }}
                  >
                    <Gauge className="w-4 h-4 text-slate-400" />
                    <span>Rate Limits</span>
                  </Link>

                  <Link
                    to="/docs/security"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-slate-600 hover:bg-slate-200/60 hover:text-slate-900 transition-colors"
                    activeProps={{ className: 'bg-slate-200 text-slate-900 font-semibold' }}
                  >
                    <ShieldCheck className="w-4 h-4 text-slate-400" />
                    <span>Security Best Practices</span>
                  </Link>

                  <Link
                    to="/docs/changelog"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-slate-600 hover:bg-slate-200/60 hover:text-slate-900 transition-colors"
                    activeProps={{ className: 'bg-slate-200 text-slate-900 font-semibold' }}
                  >
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span>Changelog</span>
                  </Link>

                  <Link
                    to="/docs/faq"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-slate-600 hover:bg-slate-200/60 hover:text-slate-900 transition-colors"
                    activeProps={{ className: 'bg-slate-200 text-slate-900 font-semibold' }}
                  >
                    <HelpCircle className="w-4 h-4 text-slate-400" />
                    <span>FAQ</span>
                  </Link>

                  <Link
                    to="/docs/support"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-slate-600 hover:bg-slate-200/60 hover:text-slate-900 transition-colors"
                    activeProps={{ className: 'bg-slate-200 text-slate-900 font-semibold' }}
                  >
                    <Headphones className="w-4 h-4 text-slate-400" />
                    <span>Support</span>
                  </Link>
                </nav>
              </div>
            </div>
          </aside>

          <div className="flex-1 ml-64 p-8 max-w-6xl">
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-6">
              <span>Scryme</span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-slate-900 font-medium">Developer Docs</span>
            </div>

            <main>
              <Outlet />
            </main>
          </div>
        </div>

        {searchOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-start justify-center pt-24 z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200">
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search documentation, guides, and V3 API endpoints..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  autoFocus
                  className="w-full text-sm outline-hidden text-slate-900 placeholder:text-slate-400 bg-transparent"
                />
                <button
                  onClick={() => setSearchOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="max-h-80 overflow-y-auto p-2 divide-y divide-slate-100">
                {searchResults.length > 0 ? (
                  searchResults.map(result => (
                    <Link
                      key={result.title}
                      to={result.to}
                      onClick={() => setSearchOpen(false)}
                      className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-100 transition-colors group"
                    >
                      <span className="text-xs font-medium text-slate-800 group-hover:text-slate-900">
                        {result.title}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                        {result.category}
                      </span>
                    </Link>
                  ))
                ) : (
                  <div className="p-4 text-center text-xs text-slate-500">No results found</div>
                )}
              </div>
            </div>
          </div>
        )}

        <Scripts />
      </body>
    </html>
  )
}
