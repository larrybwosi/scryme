import Link from "next/link";
import { ArrowUpRight, BookOpen, ShieldCheck } from "lucide-react";
import { modules } from "@/lib/scryme-tokens";

const company = [{ name: "About", href: "/about" }, { name: "Careers", href: "/careers" }, { name: "Journal", href: "/blog" }, { name: "Contact", href: "/contact" }];
const resources = [
  { name: "POS App Downloads", href: "/download" },
  { name: "Developer Portal", href: "/developer" },
  { name: "Documentation", href: "/docs" },
  { name: "API reference", href: "/api" },
  { name: "Integrations", href: "/integrations" },
  { name: "Platform status", href: "/status" },
];

export function Footer() {
  return (
    <footer className="border-t border-inkLine bg-inkBg text-textPrimary" aria-label="Site footer">
      <div className="container mx-auto py-16 sm:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div className="flex max-w-md flex-col items-start gap-5">
            <Link href="/" className="flex items-center gap-3 font-sans text-xl font-semibold tracking-tight"><span className="flex size-9 items-center justify-center rounded-md border border-brassLine bg-brassDim text-brass"><BookOpen aria-hidden="true" /></span>Scryme</Link>
            <p className="text-pretty font-sans text-base leading-relaxed text-textMuted">The commerce operating system for ambitious companies — connecting every location, channel, transaction, and team to one trusted record.</p>
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-ledgerGreen"><ShieldCheck aria-hidden="true" /> Enterprise security and 99.9% uptime SLA</div>
            <Link href="/contact" className="mt-2 inline-flex items-center gap-2 border-b border-brassLine pb-1 font-sans text-sm font-semibold text-brass">Speak with an enterprise specialist <ArrowUpRight data-icon="inline-end" aria-hidden="true" /></Link>
          </div>
          <FooterColumn title="Platform" links={modules.map((item) => ({ name: item.name, href: item.href }))} />
          <FooterColumn title="Company" links={company} />
          <FooterColumn title="Resources" links={resources} />
        </div>
      </div>
      <div className="border-t border-inkLine"><div className="container mx-auto flex flex-col gap-4 py-6 font-mono text-[10px] uppercase tracking-wider text-textFaint sm:flex-row sm:items-center sm:justify-between"><p>&copy; {new Date().getFullYear()} Scryme Technologies. All rights reserved.</p><div className="flex gap-5"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/security">Security</Link></div></div></div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: Array<{ name: string; href: string }> }) {
  return <div><h2 className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-textFaint">{title}</h2><ul className="mt-5 flex flex-col gap-3">{links.map((link) => <li key={link.name}><Link href={link.href} className="font-sans text-sm text-textMuted transition-colors hover:text-textPrimary">{link.name}</Link></li>)}</ul></div>;
}
