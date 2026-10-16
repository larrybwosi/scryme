import { Link } from '@tanstack/react-router'
import { Layers, Github, Twitter, Linkedin, ArrowUpRight } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#0d0e0f] pt-16 pb-12 text-[#8e937a]">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 pb-12 border-b border-white/10">
          <div className="md:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-[#d2ff3a] flex items-center justify-center text-[#090a0b] font-bold">
                <Layers className="w-4 h-4 stroke-[2.5]" />
              </div>
              <span className="text-lg font-bold tracking-tight text-white font-sans">
                SCRYME<span className="text-[#d2ff3a]">.</span>
              </span>
            </Link>
            <p className="text-sm text-[#c5c9ae] max-w-sm leading-relaxed">
              The Next-Gen Autonomous ERP for high-growth enterprises. Unifying multi-location inventory, RevOps, 360° CRM, and real-time operational telemetry.
            </p>
            <div className="flex gap-3 pt-2">
              <a href="#" className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#d2ff3a] hover:text-[#090a0b] transition-colors"><Twitter className="w-4 h-4" /></a>
              <a href="#" className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#d2ff3a] hover:text-[#090a0b] transition-colors"><Github className="w-4 h-4" /></a>
              <a href="#" className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#d2ff3a] hover:text-[#090a0b] transition-colors"><Linkedin className="w-4 h-4" /></a>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#d2ff3a] mb-4 font-mono">Modules</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/inventory" className="hover:text-white transition-colors">Multi-Location Inventory</Link></li>
              <li><Link to="/sales" className="hover:text-white transition-colors">Sales Automation & RevOps</Link></li>
              <li><Link to="/crm" className="hover:text-white transition-colors">360° Relationship CRM</Link></li>
              <li><Link to="/cms" className="hover:text-white transition-colors">Headless Catalog Cloud</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#d2ff3a] mb-4 font-mono">Company</h4>
            <ul className="space-y-2.5 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">About Scryme</a></li>
              <li><Link to="/pricing" className="hover:text-white transition-colors">Pricing Plans</Link></li>
              <li><a href="#" className="hover:text-white transition-colors">Enterprise Security</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#d2ff3a] mb-4 font-mono">Resources</h4>
            <ul className="space-y-2.5 text-sm">
              <li><a href="https://docs.scryme.tech" target="_blank" rel="noreferrer" className="hover:text-white transition-colors inline-flex items-center gap-1">Documentation <ArrowUpRight className="w-3 h-3" /></a></li>
              <li><a href="#" className="hover:text-white transition-colors">API Reference</a></li>
              <li><a href="#" className="hover:text-white transition-colors">System Status</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Changelog</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-[#8e937a] gap-4">
          <p>© {new Date().getFullYear()} Scryme Inc. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Security</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
