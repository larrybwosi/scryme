import { Link } from '@tanstack/react-router'
import { ArrowRight, Layers, Sparkles } from 'lucide-react'

export function Header() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#121314]/80 border-b border-white/10 px-4 md:px-8 py-4 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-lg bg-[#d2ff3a] flex items-center justify-center text-[#090a0b] font-black tracking-wider transition-transform group-hover:scale-105">
            <Layers className="w-5 h-5 stroke-[2.5]" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white font-sans">
            SCRYME<span className="text-[#d2ff3a]">.</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#c5c9ae]">
          <Link to="/" className="hover:text-white transition-colors [&.active]:text-[#d2ff3a]">Platform</Link>
          <Link to="/inventory" className="hover:text-white transition-colors [&.active]:text-[#d2ff3a]">Inventory</Link>
          <Link to="/sales" className="hover:text-white transition-colors [&.active]:text-[#d2ff3a]">Sales & RevOps</Link>
          <Link to="/crm" className="hover:text-white transition-colors [&.active]:text-[#d2ff3a]">CRM</Link>
          <Link to="/cms" className="hover:text-white transition-colors [&.active]:text-[#d2ff3a]">Catalog Cloud</Link>
          <Link to="/pricing" className="hover:text-white transition-colors [&.active]:text-[#d2ff3a]">Pricing</Link>
          <Link to="/light" className="hover:text-white transition-colors [&.active]:text-[#d2ff3a]">Light Mode</Link>
        </nav>

        <div className="flex items-center gap-3">
          <a
            href="https://app.scryme.tech/login"
            className="hidden sm:inline-flex px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#e3e2e3] hover:text-white border border-white/15 rounded-full hover:bg-white/5 transition"
          >
            Sign In
          </a>
          <a
            href="https://app.scryme.tech/signup"
            className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold uppercase tracking-wider text-[#090a0b] bg-[#d2ff3a] rounded-full hover:bg-[#c7f32c] hover:shadow-[0_0_20px_rgba(210,255,58,0.4)] transition-all transform active:scale-95"
          >
            <span>Get Started</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </header>
  )
}
