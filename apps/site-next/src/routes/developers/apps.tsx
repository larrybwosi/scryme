import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Header } from '../../components/Header'
import { Footer } from '../../components/Footer'
import {
  Shield,
  Key,
  Plus,
  Copy,
  Check,
  Eye,
  EyeOff,
  Terminal,
  Code2,
  Trash2,
  ExternalLink,
  Lock,
  Globe,
  Smartphone,
  Info,
  Layers,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  X,
  CheckCircle2,
  ArrowRight
} from 'lucide-react'

export const Route = createFileRoute('/developers/apps')({
  component: DevelopersAppsPage,
})

interface OAuthClientApp {
  id: string
  clientId: string
  clientSecret: string
  name: string
  icon?: string
  uri?: string
  redirectUris: string[]
  responseTypes: string[]
  grantTypes: string[]
  public: boolean
  requirePKCE: boolean
  scopes: string[]
  createdAt: string
  updatedAt: string
}

const DEFAULT_SCOPES = [
  { id: 'openid', name: 'openid', description: 'Authenticate users and issue OIDC ID tokens', required: true },
  { id: 'profile', name: 'profile', description: 'Access basic profile info (name, avatar, username)', required: false },
  { id: 'email', name: 'email', description: 'Access user primary email address', required: false },
  { id: 'offline_access', name: 'offline_access', description: 'Issue refresh tokens for persistent background access', required: false },
]

export function DevelopersAppsPage() {
  // Session Simulation / Demo Auth Guard State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true)
  const [isDemoWorkspace, setIsDemoWorkspace] = useState<boolean>(false)

  // OAuth Clients State
  const [apps, setApps] = useState<OAuthClientApp[]>([
    {
      id: 'app_1',
      clientId: 'scryme_client_live_8941a9f02b3c4d',
      clientSecret: 'scryme_sec_991823ab45cd67ef8901234567890abcdef1',
      name: 'Acme Mobile App',
      icon: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&h=100&fit=crop',
      uri: 'https://acme.com',
      redirectUris: ['https://acme.com/auth/callback', 'acmeapp://oauth-callback'],
      responseTypes: ['code'],
      grantTypes: ['authorization_code', 'refresh_token'],
      public: true,
      requirePKCE: true,
      scopes: ['openid', 'profile', 'email', 'offline_access'],
      createdAt: '2025-01-15T10:30:00Z',
      updatedAt: '2025-02-01T14:20:00Z'
    },
    {
      id: 'app_2',
      clientId: 'scryme_client_live_7732b11c990a1f',
      clientSecret: 'scryme_sec_1092838481230491820391820391823a',
      name: 'Aetheria Analytics Portal',
      uri: 'https://analytics.aetheria.io',
      redirectUris: ['https://analytics.aetheria.io/api/auth/callback/scryme'],
      responseTypes: ['code'],
      grantTypes: ['authorization_code', 'refresh_token'],
      public: false,
      requirePKCE: true,
      scopes: ['openid', 'profile', 'email'],
      createdAt: '2025-02-10T08:15:00Z',
      updatedAt: '2025-02-10T08:15:00Z'
    }
  ])

  // UI Selection & Modal States
  const [selectedApp, setSelectedApp] = useState<OAuthClientApp | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'details' | 'snippets' | 'settings'>('details')
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({})
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [activeSnippetTab, setActiveSnippetTab] = useState<'nextjs' | 'node' | 'curl'>('nextjs')

  // New Client Form State
  const [formData, setFormData] = useState({
    name: '',
    uri: '',
    redirectUrisText: '',
    isPublic: false,
    requirePKCE: true,
    scopes: ['openid', 'profile', 'email']
  })
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    if (apps.length > 0 && !selectedApp) {
      setSelectedApp(apps[0])
    }
  }, [apps])

  const copyToClipboard = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(fieldId)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const toggleSecretVisibility = (appId: string) => {
    setShowSecret((prev) => ({ ...prev, [appId]: !prev[appId] }))
  }

  const handleCreateApp = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!formData.name.trim()) {
      setFormError('Application Name is required.')
      return
    }

    const redirectUris = formData.redirectUrisText
      .split('\n')
      .map((u) => u.trim())
      .filter((u) => u.length > 0)

    if (redirectUris.length === 0) {
      setFormError('At least one valid Redirect URI is required.')
      return
    }

    const newClientId = `scryme_client_${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 8)}`
    const newClientSecret = `scryme_sec_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`

    const newApp: OAuthClientApp = {
      id: `app_${Date.now()}`,
      clientId: newClientId,
      clientSecret: newClientSecret,
      name: formData.name.trim(),
      uri: formData.uri.trim() || undefined,
      redirectUris,
      responseTypes: ['code'],
      grantTypes: ['authorization_code', 'refresh_token'],
      public: formData.isPublic,
      requirePKCE: formData.requirePKCE,
      scopes: formData.scopes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    setApps([newApp, ...apps])
    setSelectedApp(newApp)
    setIsCreateModalOpen(false)
    setFormData({
      name: '',
      uri: '',
      redirectUrisText: '',
      isPublic: false,
      requirePKCE: true,
      scopes: ['openid', 'profile', 'email']
    })
  }

  const handleDeleteApp = (appId: string) => {
    if (confirm('Are you sure you want to revoke and delete this Auth Client? Any app using these credentials will no longer be able to authenticate users.')) {
      const remaining = apps.filter((a) => a.id !== appId)
      setApps(remaining)
      if (selectedApp?.id === appId) {
        setSelectedApp(remaining.length > 0 ? remaining[0] : null)
      }
    }
  }

  const handleRotateSecret = (appId: string) => {
    if (confirm('Are you sure you want to rotate the Client Secret? The existing secret will be invalidated immediately.')) {
      const newSecret = `scryme_sec_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`
      setApps((prev) =>
        prev.map((a) => (a.id === appId ? { ...a, clientSecret: newSecret, updatedAt: new Date().toISOString() } : a))
      )
      if (selectedApp?.id === appId) {
        setSelectedApp((prev) => (prev ? { ...prev, clientSecret: newSecret } : null))
      }
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] font-sans selection:bg-[#d2ff3a] selection:text-[#090a0b] transition-colors">
      <Header />

      {/* Page Header */}
      <section className="border-b border-white/10 dark:border-white/10 light:border-black/10 py-12 px-4 md:px-8 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d2ff3a]/10 text-[#d2ff3a] text-xs font-mono mb-3">
              <Shield className="w-3.5 h-3.5" />
              <span>Scryme Developer Console • OIDC / OAuth 2.0 Provider</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-serif dark:text-white light:text-[#090a0b] tracking-tight">
              Auth Clients & Login with Scryme
            </h1>
            <p className="text-sm md:text-base text-[var(--text-muted)] mt-2 max-w-2xl">
              Configure OAuth 2.0 / OIDC applications to enable single sign-on (SSO) with Scryme accounts in your web apps, mobile apps, or internal microservices.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-3 text-xs font-bold uppercase tracking-wider text-[#090a0b] bg-[#d2ff3a] rounded-full hover:bg-[#c7f32c] hover:shadow-[0_0_25px_rgba(210,255,58,0.4)] transition-all transform active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Create Auth Client</span>
            </button>
          </div>
        </div>
      </section>

      {/* Main Developer Console Body */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-10">
        {!isAuthenticated && (
          <div className="glass-panel p-6 rounded-2xl border-amber-500/30 bg-amber-500/5 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-amber-200">Authentication Required</h3>
                <p className="text-xs text-amber-300/80 mt-1">
                  You are currently viewing in read-only preview mode. Please sign in with your Scryme Developer account to persist registered Auth Clients.
                </p>
              </div>
            </div>
            <a
              href="https://app.scryme.tech/login"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider text-black bg-amber-400 rounded-full hover:bg-amber-300 transition"
            >
              Sign In Now
            </a>
          </div>
        )}

        {apps.length === 0 ? (
          /* Empty State */
          <div className="glass-panel p-12 text-center rounded-3xl border-white/10 max-w-xl mx-auto my-12">
            <div className="w-16 h-16 rounded-2xl bg-[#d2ff3a]/10 text-[#d2ff3a] flex items-center justify-center mx-auto mb-6">
              <Key className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-serif dark:text-white light:text-[#090a0b] mb-2">No Auth Clients Configured</h3>
            <p className="text-sm text-[var(--text-muted)] mb-8">
              Register your first OAuth 2.0 client application to start authenticating users with Scryme Single Sign-On (SSO).
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 text-xs font-bold uppercase tracking-wider text-[#090a0b] bg-[#d2ff3a] rounded-full hover:bg-[#c7f32c] transition"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Create First Auth Client</span>
            </button>
          </div>
        ) : (
          /* Apps Console Layout */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Sidebar: Apps List */}
            <div className="lg:col-span-4 space-y-4">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-mono uppercase tracking-wider text-[var(--text-muted)]">
                  Registered Clients ({apps.length})
                </span>
              </div>

              <div className="space-y-3">
                {apps.map((app) => {
                  const isSelected = selectedApp?.id === app.id
                  return (
                    <button
                      key={app.id}
                      onClick={() => setSelectedApp(app)}
                      className={`w-full text-left p-4 rounded-2xl transition-all border ${
                        isSelected
                          ? 'bg-[#d2ff3a]/10 border-[#d2ff3a] shadow-[0_0_20px_rgba(210,255,58,0.1)]'
                          : 'glass-panel border-white/10 hover:border-white/20 hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                            {app.icon ? (
                              <img src={app.icon} alt={app.name} className="w-full h-full object-cover" />
                            ) : (
                              <Shield className="w-5 h-5 text-[#d2ff3a]" />
                            )}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold dark:text-white light:text-[#090a0b]">{app.name}</h4>
                            <p className="text-[11px] font-mono text-[var(--text-muted)] truncate max-w-[180px]">
                              {app.clientId}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                              app.public
                                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            }`}
                          >
                            {app.public ? 'Public' : 'Confidential'}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-[var(--text-muted)] font-mono">
                        <span>PKCE: {app.requirePKCE ? 'REQUIRED' : 'OPTIONAL'}</span>
                        <span>{app.redirectUris.length} Redirect URI(s)</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Right Panel: Selected App Detail */}
            {selectedApp && (
              <div className="lg:col-span-8 glass-panel rounded-3xl p-6 md:p-8 border-white/10 space-y-6">
                {/* Header Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#d2ff3a]/10 border border-[#d2ff3a]/30 flex items-center justify-center shrink-0">
                      <Shield className="w-6 h-6 text-[#d2ff3a]" />
                    </div>
                    <div>
                      <h2 className="text-xl md:text-2xl font-bold dark:text-white light:text-[#090a0b]">
                        {selectedApp.name}
                      </h2>
                      <p className="text-xs font-mono text-[var(--text-muted)] mt-0.5">
                        Client ID: {selectedApp.clientId}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDeleteApp(selectedApp.id)}
                      className="p-2 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition"
                      title="Delete Auth Client"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Sub-tabs */}
                <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                  <button
                    onClick={() => setActiveTab('details')}
                    className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider font-mono transition ${
                      activeTab === 'details'
                        ? 'bg-[#d2ff3a] text-[#090a0b]'
                        : 'text-[var(--text-muted)] hover:text-white hover:bg-white/5'
                    }`}
                  >
                    Credentials & Config
                  </button>
                  <button
                    onClick={() => setActiveTab('snippets')}
                    className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider font-mono transition ${
                      activeTab === 'snippets'
                        ? 'bg-[#d2ff3a] text-[#090a0b]'
                        : 'text-[var(--text-muted)] hover:text-white hover:bg-white/5'
                    }`}
                  >
                    Quick Integration Snippets
                  </button>
                </div>

                {/* Tab 1: Credentials & Config */}
                {activeTab === 'details' && (
                  <div className="space-y-6">
                    {/* Credentials Card */}
                    <div className="p-5 rounded-2xl bg-black/40 border border-white/10 space-y-4 font-mono">
                      <h3 className="text-xs uppercase tracking-wider font-bold text-[#d2ff3a]">
                        OAuth 2.0 Credentials
                      </h3>

                      {/* Client ID */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] text-[var(--text-muted)]">Client ID</label>
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10 text-xs">
                          <input
                            type="text"
                            readOnly
                            value={selectedApp.clientId}
                            className="bg-transparent flex-1 outline-none text-slate-200"
                          />
                          <button
                            onClick={() => copyToClipboard(selectedApp.clientId, `cid_${selectedApp.id}`)}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition"
                            title="Copy Client ID"
                          >
                            {copiedField === `cid_${selectedApp.id}` ? (
                              <Check className="w-4 h-4 text-[#d2ff3a]" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Client Secret */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] text-[var(--text-muted)]">Client Secret</label>
                          {!selectedApp.public && (
                            <button
                              onClick={() => handleRotateSecret(selectedApp.id)}
                              className="text-[10px] text-amber-400 hover:underline flex items-center gap-1"
                            >
                              <RefreshCw className="w-3 h-3" /> Rotate Secret
                            </button>
                          )}
                        </div>
                        {selectedApp.public ? (
                          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300">
                            Public Client Application (Mobile/SPA) — Client Secret is omitted to prevent exposure.
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10 text-xs">
                            <input
                              type={showSecret[selectedApp.id] ? 'text' : 'password'}
                              readOnly
                              value={selectedApp.clientSecret}
                              className="bg-transparent flex-1 outline-none text-slate-200 tracking-wider"
                            />
                            <button
                              onClick={() => toggleSecretVisibility(selectedApp.id)}
                              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition"
                              title="Toggle Visibility"
                            >
                              {showSecret[selectedApp.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => copyToClipboard(selectedApp.clientSecret, `sec_${selectedApp.id}`)}
                              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition"
                              title="Copy Client Secret"
                            >
                              {copiedField === `sec_${selectedApp.id}` ? (
                                <Check className="w-4 h-4 text-[#d2ff3a]" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Authorized Redirect URIs */}
                    <div className="p-5 rounded-2xl bg-black/40 border border-white/10 space-y-3 font-mono">
                      <h3 className="text-xs uppercase tracking-wider font-bold text-[#d2ff3a]">
                        Allowed Redirect URIs
                      </h3>
                      <div className="space-y-2">
                        {selectedApp.redirectUris.map((uri, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-white/5 text-xs text-slate-300">
                            <span className="truncate">{uri}</span>
                            <span className="text-[10px] text-emerald-400 uppercase tracking-widest shrink-0">MATCHED</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* OAuth Scopes & Enforcement */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-5 rounded-2xl bg-black/40 border border-white/10 space-y-3">
                        <h3 className="text-xs uppercase tracking-wider font-bold text-[#d2ff3a] font-mono">
                          Enabled OAuth Scopes
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedApp.scopes.map((scope) => (
                            <span
                              key={scope}
                              className="px-3 py-1 rounded-full bg-[#d2ff3a]/10 border border-[#d2ff3a]/30 text-[#d2ff3a] text-xs font-mono"
                            >
                              {scope}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="p-5 rounded-2xl bg-black/40 border border-white/10 space-y-3 font-mono">
                        <h3 className="text-xs uppercase tracking-wider font-bold text-[#d2ff3a]">
                          Security Enforcement
                        </h3>
                        <div className="space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">PKCE Enforcement:</span>
                            <span className="text-emerald-400 font-bold">
                              {selectedApp.requirePKCE ? 'ENABLED (S256)' : 'DISABLED'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Allowed Grant Types:</span>
                            <span className="text-slate-200">authorization_code, refresh_token</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 2: Quick Integration Snippets */}
                {activeTab === 'snippets' && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 border-b border-white/10 pb-3 font-mono text-xs">
                      <button
                        onClick={() => setActiveSnippetTab('nextjs')}
                        className={`px-3 py-1.5 rounded-lg transition ${
                          activeSnippetTab === 'nextjs' ? 'bg-[#d2ff3a]/20 text-[#d2ff3a] font-bold' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Next.js / React
                      </button>
                      <button
                        onClick={() => setActiveSnippetTab('node')}
                        className={`px-3 py-1.5 rounded-lg transition ${
                          activeSnippetTab === 'node' ? 'bg-[#d2ff3a]/20 text-[#d2ff3a] font-bold' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Node.js / Express
                      </button>
                      <button
                        onClick={() => setActiveSnippetTab('curl')}
                        className={`px-3 py-1.5 rounded-lg transition ${
                          activeSnippetTab === 'curl' ? 'bg-[#d2ff3a]/20 text-[#d2ff3a] font-bold' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        cURL / HTTP Redirect
                      </button>
                    </div>

                    <div className="p-5 rounded-2xl bg-[#090a0b] border border-white/10 font-mono text-xs text-slate-300 relative space-y-4">
                      {activeSnippetTab === 'nextjs' && (
                        <pre className="overflow-x-auto text-emerald-400 leading-relaxed">
{`// Login with Scryme OIDC Integration in Next.js Auth / NextAuth
export const authOptions = {
  providers: [
    {
      id: "scryme",
      name: "Scryme",
      type: "oauth",
      wellKnown: "https://api.scryme.tech/v3/auth/.well-known/openid-configuration",
      clientId: "${selectedApp.clientId}",
      clientSecret: "${selectedApp.public ? '[Omitted - Public PKCE Client]' : selectedApp.clientSecret}",
      authorization: { params: { scope: "${selectedApp.scopes.join(' ')}" } },
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture
        }
      }
    }
  ]
}`}
                        </pre>
                      )}

                      {activeSnippetTab === 'node' && (
                        <pre className="overflow-x-auto text-[#d2ff3a] leading-relaxed">
{`// Redirect user to Scryme OAuth Authorization Endpoint
const scrymeAuthUrl = new URL('https://api.scryme.tech/v3/auth/oauth/authorize');
scrymeAuthUrl.searchParams.append('client_id', '${selectedApp.clientId}');
scrymeAuthUrl.searchParams.append('redirect_uri', '${selectedApp.redirectUris[0] || 'https://your-app.com/callback'}');
scrymeAuthUrl.searchParams.append('response_type', 'code');
scrymeAuthUrl.searchParams.append('scope', '${selectedApp.scopes.join(' ')}');
scrymeAuthUrl.searchParams.append('code_challenge', codeChallenge);
scrymeAuthUrl.searchParams.append('code_challenge_method', 'S256');

res.redirect(scrymeAuthUrl.toString());`}
                        </pre>
                      )}

                      {activeSnippetTab === 'curl' && (
                        <pre className="overflow-x-auto text-blue-300 leading-relaxed">
{`# Exchange Authorization Code for Tokens
curl -X POST https://api.scryme.tech/v3/auth/oauth/token \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  -d "grant_type=authorization_code" \\
  -d "client_id=${selectedApp.clientId}" \\
  -d "client_secret=${selectedApp.public ? '[OMIT_FOR_PUBLIC_PKCE]' : selectedApp.clientSecret}" \\
  -d "code=AUTHORIZATION_CODE" \\
  -d "redirect_uri=${selectedApp.redirectUris[0] || 'https://your-app.com/callback'}" \\
  -d "code_verifier=YOUR_PKCE_CODE_VERIFIER"`}
                        </pre>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Create Auth Client Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="glass-panel-elevated w-full max-w-xl rounded-3xl p-6 md:p-8 border-white/10 space-y-6 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#d2ff3a]/10 text-[#d2ff3a] flex items-center justify-center">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold dark:text-white light:text-[#090a0b]">Register Auth Client</h3>
                  <p className="text-xs text-[var(--text-muted)]">Configure a new app for Login with Scryme</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateApp} className="space-y-5 text-sm">
              {/* App Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Application Name <span className="text-[#d2ff3a]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Web Store"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-[#d2ff3a] transition"
                />
              </div>

              {/* Application Homepage URI */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Application Homepage URL
                </label>
                <input
                  type="url"
                  placeholder="https://acme.com"
                  value={formData.uri}
                  onChange={(e) => setFormData({ ...formData, uri: e.target.value })}
                  className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-[#d2ff3a] transition"
                />
              </div>

              {/* Redirect URIs */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Authorized Redirect URIs (One per line) <span className="text-[#d2ff3a]">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="https://acme.com/api/auth/callback&#10;https://staging.acme.com/oauth/callback"
                  value={formData.redirectUrisText}
                  onChange={(e) => setFormData({ ...formData, redirectUrisText: e.target.value })}
                  className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-xs outline-none focus:border-[#d2ff3a] transition"
                />
              </div>

              {/* Application Type */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Client Application Type
                </label>
                <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isPublic: false })}
                    className={`p-3 rounded-xl border text-left transition ${
                      !formData.isPublic
                        ? 'bg-[#d2ff3a]/10 border-[#d2ff3a] text-white'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    <div className="font-bold">Confidential (Web App)</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Includes Client Secret (Backend server)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isPublic: true })}
                    className={`p-3 rounded-xl border text-left transition ${
                      formData.isPublic
                        ? 'bg-[#d2ff3a]/10 border-[#d2ff3a] text-white'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    <div className="font-bold">Public (Mobile / SPA)</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">PKCE mandatory (No Client Secret)</div>
                  </button>
                </div>
              </div>

              {/* Scopes Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Requested Scopes
                </label>
                <div className="space-y-2">
                  {DEFAULT_SCOPES.map((s) => {
                    const isChecked = formData.scopes.includes(s.id)
                    return (
                      <label
                        key={s.id}
                        className="flex items-start gap-3 p-2.5 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 cursor-pointer transition"
                      >
                        <input
                          type="checkbox"
                          disabled={s.required}
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({ ...formData, scopes: [...formData.scopes, s.id] })
                            } else {
                              setFormData({ ...formData, scopes: formData.scopes.filter((sc) => sc !== s.id) })
                            }
                          }}
                          className="mt-0.5 rounded accent-[#d2ff3a]"
                        />
                        <div>
                          <div className="font-mono text-xs font-bold text-white flex items-center gap-2">
                            <span>{s.name}</span>
                            {s.required && <span className="text-[10px] text-[#d2ff3a]">(Required)</span>}
                          </div>
                          <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{s.description}</p>
                        </div>
                      </label>
                    )
                  })}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-5 py-2.5 rounded-full text-xs font-semibold text-slate-300 hover:bg-white/10 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider text-[#090a0b] bg-[#d2ff3a] hover:bg-[#c7f32c] transition"
                >
                  Register Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
