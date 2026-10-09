import { createFileRoute, Link } from '@tanstack/react-router'
import {
  Play,
  Package,
  Layers,
  Code2,
  BookOpen,
  HelpCircle,
  ArrowRight
} from 'lucide-react'

export const Route = createFileRoute('/')({
  component: HomePage
})

function HomePage() {
  const startingCards = [
    {
      title: 'Getting Started',
      desc: 'Enhance your project with our pre-built components and pages.',
      icon: Play,
      to: '/docs/getting-started'
    },
    {
      title: 'Installation',
      desc: 'Enhance your project with our pre-built components and pages.',
      icon: Package,
      to: '/docs/installation'
    },
    {
      title: 'Components',
      desc: 'Enhance your project with our pre-built components and pages.',
      icon: Layers,
      to: '/docs/components'
    },
    {
      title: 'API Reference',
      desc: 'Enhance your project with our pre-built components and pages.',
      icon: Code2,
      to: '/api-reference'
    },
    {
      title: 'Guides',
      desc: 'Enhance your project with our pre-built components and pages.',
      icon: BookOpen,
      to: '/docs/core-concepts'
    }
  ]

  return (
    <div className="space-y-10">
      {/* Title & Description Header */}
      <div className="space-y-3">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Documentation</h1>
        <p className="text-slate-600 text-base max-w-2xl leading-relaxed">
          This site is designed to help you get the most out of the platform. Here, you'll find a collection of
          articles and tutorials covering all aspects of its features.
        </p>
      </div>

      <hr className="border-slate-200" />

      {/* Good Starting Point Section */}
      <div className="space-y-6">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-900">Good starting point</h2>
          <p className="text-sm text-slate-500">Everything you need to start using the platform quickly and efficiently.</p>
        </div>

        {/* Cards Grid */}
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
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

      {/* Need Help Footer Section */}
      <div className="pt-6 border-t border-slate-200 space-y-3">
        <h2 className="text-xl font-bold text-slate-900">Need help?</h2>
        <p className="text-sm text-slate-500">
          Have a question, need some help or advice, reach out to out support team. We're here to help!
        </p>
        <p className="text-xs font-semibold text-slate-900 flex items-center gap-1">
          See: <Link to="/docs/support" className="text-slate-900 underline hover:text-slate-700">Getting Help</Link>
        </p>
      </div>
    </div>
  )
}
