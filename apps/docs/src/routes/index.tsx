import { createFileRoute, Link } from '@tanstack/react-router'
import {
  Play,
  Package,
  Layers,
  Code2,
  BookOpen,
  ShieldCheck,
  ArrowRight
} from 'lucide-react'

export const Route = createFileRoute('/')({
  component: HomePage
})

function HomePage() {
  const startingCards = [
    {
      title: 'Getting Started',
      desc: 'Understand the platform model, tenancy, and the first steps for integrating with Scryme V3.',
      icon: Play,
      to: '/docs/getting-started'
    },
    {
      title: 'Installation',
      desc: 'Set up the SDK, CLI, and local environment for production-safe integrations and deployments.',
      icon: Package,
      to: '/docs/installation'
    },
    {
      title: 'Core Concepts',
      desc: 'Learn how multi-tenant access, location-aware stock, and resource-level security work together.',
      icon: Layers,
      to: '/docs/core-concepts'
    },
    {
      title: 'API Reference',
      desc: 'Review the V3 REST modules for POS, inventory, stock transfers, and public booking flows.',
      icon: Code2,
      to: '/api-reference'
    },
    {
      title: 'Security',
      desc: 'Follow the security patterns for tenant isolation, secrets management, and webhook validation.',
      icon: ShieldCheck,
      to: '/docs/security'
    },
    {
      title: 'Guides',
      desc: 'Explore architectures for integrations, public booking, and operational workflows across apps.',
      icon: BookOpen,
      to: '/docs/integrations'
    }
  ]

  return (
    <div className="space-y-10">
      <div className="space-y-3">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Scryme Developer Documentation</h1>
        <p className="text-slate-600 text-base max-w-3xl leading-relaxed">
          Scryme is an enterprise ERP and retail operations platform for multi-location stores, bakeries,
          supermarkets, and service businesses. This documentation is designed to help developers connect,
          configure, and extend the platform with clear architecture guidance and implementation patterns.
        </p>
      </div>

      <hr className="border-slate-200" />

      <div className="space-y-6">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-900">Start here</h2>
          <p className="text-sm text-slate-500">
            Choose the entry point that matches your work: platform setup, integrations, API access, or security configuration.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {startingCards.slice(0, 3).map((card) => {
            const Icon = card.icon
            return (
              <Link
                key={card.title}
                to={card.to}
                className="bg-white border border-slate-200/80 rounded-2xl p-6 hover:shadow-md hover:border-slate-300 transition-all group flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-800 border border-slate-200/60 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base mb-1">{card.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">{card.desc}</p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {startingCards.slice(3).map((card) => {
            const Icon = card.icon
            return (
              <Link
                key={card.title}
                to={card.to}
                className="bg-white border border-slate-200/80 rounded-2xl p-6 hover:shadow-md hover:border-slate-300 transition-all group flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-800 border border-slate-200/60 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base mb-1">{card.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">{card.desc}</p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      <div className="pt-6 border-t border-slate-200 space-y-3">
        <h2 className="text-xl font-bold text-slate-900">Need help?</h2>
        <p className="text-sm text-slate-500">
          If you are implementing a new workflow, validating a production deployment, or troubleshooting a tenant issue,
          use the support guide to route your request to the right team.
        </p>
        <p className="text-xs font-semibold text-slate-900 flex items-center gap-1">
          See: <Link to="/docs/support" className="text-slate-900 underline hover:text-slate-700">Getting Help</Link>
        </p>
      </div>
    </div>
  )
}
