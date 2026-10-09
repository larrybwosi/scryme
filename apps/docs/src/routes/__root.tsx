import { createRootRoute, HeadContent, Link, Outlet, Scripts } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import {
  Search,
  BookOpen,
  Box,
  Code2,
  SlidersHorizontal,
  Bell,
  Plug,
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
  ShoppingBag,
  Package,
  DollarSign,
  Users,
  Factory
} from 'lucide-react'
import appCss from '../styles/app.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Scryme Developer Docs & V3 API Reference' }
    ],
    links: [{ rel: 'stylesheet', href: appCss }]
  }),
  component: RootComponent
})

function RootComponent() {
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

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

  const navSections = [
    {
      title: 'Menu',
      items: [
        { label: 'Getting Started', to: '/docs/getting-started', icon: Play },
        { label: 'Installation', to: '/docs/installation', icon: Package },
        { label: 'Components', to: '/docs/components', icon: Layers, hasSub: true },
        { label: 'API Reference', to: '/api-reference', icon: Code2, hasSub: true },
        { label: 'Guides', to: '/docs/core-concepts', icon: BookOpen, hasSub: true },
        { label: 'Webhooks', to: '/docs/webhooks', icon: Bell },
        { label: 'Third-Party Integrations', to: '/docs/integrations', icon: Plug },
        { label: 'Rate Limits', to: '/docs/rate-limits', icon: Gauge },
        { label: 'Security Best Practices', to: '/docs/security', icon: ShieldCheck },
        { label: 'Documentation', to: '/docs/core-concepts', icon: FileText },
        { label: 'Changelog', to: '/docs/changelog', icon: FileText },
        { label: 'FAQ', to: '/docs/faq', icon: HelpCircle },
        { label: 'Support', to: '/docs/support', icon: Headphones }
      ]
    }
  ]

  const searchResults = [
    { title: 'Getting Started', category: 'Guide', to: '/docs/getting-started' },
    { title: 'POS & Sales API', category: 'API Reference', to: '/api-reference/pos' },
    { title: 'Inventory & Stocking API', category: 'API Reference', to: '/api-reference/stocking' },
    { title: 'Multi-Tenant Auth & Security', category: 'Guide', to: '/docs/core-concepts' },
    { title: 'Scalar Interactive API Playground', category: 'API Reference', to: '/api-reference/playground' }
  ].filter(r => r.title.toLowerCase().includes(searchQuery.toLowerCase()) || r.category.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="bg-slate-100 text-slate-900 min-h-screen font-sans antialiased">
        <div className="flex min-h-screen">
          {/* Sidebar */}
          <aside className="w-64 bg-slate-50 border-r border-slate-200 flex flex-col justify-between p-4 shrink-0 fixed top-0 bottom-0 left-0 overflow-y-auto">
            <div className="space-y-4">
              {/* Top Header Card */}
              <div className="flex items-center justify-between p-2 rounded-xl border border-slate-200 bg-white shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center font-bold text-sm">
                    <Box className="w-5 h-5" />
                  </div>
                  <div>
                    <h1 className="font-semibold text-sm leading-tight text-slate-900">Documentation</h1>
                    <span className="text-xs text-slate-500">v3.0.0</span>
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </div>

              {/* Search Trigger */}
              <button
                onClick={() => setSearchOpen(true)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs text-slate-500 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-colors shadow-2xs"
              >
                <div className="flex items-center gap-2">
                  <Search className="w-3.5 h-3.5 text-slate-400" />
                  <span>Search</span>
                </div>
                <kbd className="px-1.5 py-0.5 text-[10px] bg-slate-100 text-slate-500 rounded border border-slate-200">
                  ⌘F
                </kbd>
              </button>

              {/* Top Navigation Options */}
              <div className="space-y-0.5 border-b border-slate-200 pb-3">
                <Link
                  to="/"
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-200/60 transition-colors"
                  activeProps={{ className: 'bg-slate-200/80 text-slate-900 font-semibold' }}
                >
                  <BookOpen className="w-4 h-4 text-slate-500" />
                  Documentation
                </Link>
                <a
                  href="#"
                  className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-200/60 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Box className="w-4 h-4 text-slate-500" />
                    Themes
                  </div>
                  <span className="px-1.5 py-0.5 text-[10px] font-semibold text-orange-600 bg-orange-100 rounded-full">
                    Hot
                  </span>
                </a>
                <a
                  href="https://github.com"
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

              {/* Menu Section */}
              {navSections.map(section => (
                <div key={section.title} className="space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3">
                    {section.title}
                  </span>
                  <nav className="space-y-0.5 pt-1">
                    {section.items.map(item => {
                      const Icon = item.icon
                      return (
                        <Link
                          key={item.label}
                          to={item.to}
                          className="flex items-center justify-between px-3 py-2 rounded-lg text-xs text-slate-600 hover:bg-slate-200/60 hover:text-slate-900 transition-colors"
                          activeProps={{ className: 'bg-slate-200 text-slate-900 font-semibold' }}
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon className="w-4 h-4 text-slate-400" />
                            <span>{item.label}</span>
                          </div>
                          {item.hasSub && <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                        </Link>
                      )
                    })}
                  </nav>
                </div>
              ))}
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="flex-1 ml-64 p-8 max-w-6xl">
            {/* Breadcrumb Header */}
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-6">
              <span>My Application</span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-slate-900 font-medium">Dashboard</span>
            </div>

            <main>
              <Outlet />
            </main>
          </div>
        </div>

        {/* CMD+K Search Overlay */}
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
