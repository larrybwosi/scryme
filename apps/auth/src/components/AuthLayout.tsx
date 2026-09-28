import React, { ReactNode } from "react";
import { Shield, Building2, CheckCircle2 } from "lucide-react";

const monoClass = "font-mono";
const displayClass = "font-serif";

function SealMark() {
  return (
    <div className="absolute top-12 left-12 flex items-center gap-2.5 z-10">
      <div className="w-8 h-8 rounded-lg bg-[#A9824C]/20 border border-[#A9824C]/40 flex items-center justify-center text-[#DDC49B] font-bold text-sm tracking-widest shadow-inner">
        S
      </div>
      <span className="text-[#E2D9CC] font-bold text-lg tracking-tight">
        Scryme
      </span>
      <span className="text-[10px] font-mono tracking-widest text-[#A9824C] uppercase bg-[#A9824C]/10 px-2 py-0.5 rounded border border-[#A9824C]/20">
        Auth
      </span>
    </div>
  );
}

function ComplianceBadge({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <div
      className={`absolute z-10 hidden xl:flex items-center gap-1.5 px-3 py-1 bg-white/5 backdrop-blur-md border border-white/10 rounded-full text-[11px] font-mono text-[#C9A876] shadow-sm ${className}`}
    >
      <Shield className="w-3 h-3 text-[#A9824C]" />
      <span>{label}</span>
    </div>
  );
}

function VerificationLedger() {
  const entries = [
    {
      vendor: "Acme Enterprise Corp",
      badge: "SAML 2.0 / Okta",
      status: "SSO Verified",
    },
    {
      vendor: "Global Logistics Ltd",
      badge: "OIDC / Azure AD",
      status: "SSO Verified",
    },
    {
      vendor: "FinTech Partners Inc",
      badge: "OAuth2 / OIDC",
      status: "Client Authorized",
    },
  ];

  return (
    <div className="space-y-2.5 my-6 max-w-sm">
      <div className="text-[11px] font-mono text-[#AEBBCB] uppercase tracking-wider mb-3 flex items-center gap-2">
        <Building2 className="w-3.5 h-3.5 text-[#A9824C]" />
        Federated Identity & OAuth Ledger
      </div>
      {entries.map((item, idx) => (
        <div
          key={idx}
          className="flex items-center justify-between p-2.5 bg-white/5 border border-white/10 rounded-lg backdrop-blur-sm text-xs"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#4FA871]" />
            <span className="font-medium text-white/90">{item.vendor}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-white/50 bg-white/5 px-1.5 py-0.5 rounded">
              {item.badge}
            </span>
            <span className="text-[10px] font-mono text-[#4FA871]">
              {item.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-2xl font-bold text-white tracking-tight">{value}</div>
      <div className="text-xs text-[#AEBBCB] mt-0.5">{label}</div>
    </div>
  );
}

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full flex bg-[#FBFAF7] text-[#0F1B2E]">
      {/* Left Panel */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-12 lg:max-w-[560px] xl:max-w-[640px] relative z-10 overflow-y-auto">
        <div className="w-full max-w-md mx-auto my-auto py-8">
          {children}

          {/* Trust badge */}
          <div className="mt-8 flex items-center justify-center gap-2 text-[11px] text-[#9AA6B2]">
            <Shield className="h-3.5 w-3.5 text-[#A9824C]" />
            <span className={`${monoClass} tracking-wide`}>
              SOC 2 TYPE II · 256-BIT ENCRYPTION · GDPR COMPLIANT
            </span>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="hidden lg:flex flex-1 bg-[#0F1B2E] text-white relative overflow-hidden flex-col justify-between p-12">
        {/* Dot-grid instrument texture */}
        <div
          className="absolute inset-0 opacity-[0.10]"
          style={{
            backgroundImage: `radial-gradient(rgba(255,255,255,0.9) 1px, transparent 1px)`,
            backgroundSize: "22px 22px",
          }}
        />

        {/* Glow blobs */}
        <div className="absolute top-[-80px] right-[-80px] w-[360px] h-[360px] rounded-full bg-[#A9824C]/10 blur-[80px] pointer-events-none" />
        <div className="absolute bottom-[-60px] left-[-60px] w-[280px] h-[280px] rounded-full bg-[#2F5D8A]/15 blur-[70px] pointer-events-none" />

        <SealMark />

        {/* Compliance credentials */}
        <ComplianceBadge label="SOC 2 Type II" className="top-16 right-16" />
        <ComplianceBadge label="ISO 27001" className="top-40 right-32" />
        <ComplianceBadge label="GDPR Ready" className="bottom-76 left-12" />
        <ComplianceBadge label="KYB Verified" className="top-60 left-16" />

        {/* Session micro-label */}
        <div
          className={`${monoClass} relative z-10 flex items-center gap-2 text-[10px] tracking-wider text-white/40 uppercase`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#4FA871] animate-pulse" />
          Secure session · TLS 1.3
        </div>

        {/* Main copy */}
        <div className="relative z-10 mt-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#A9824C]/15 border border-[#A9824C]/25 rounded-full mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-[#C9A876] animate-pulse" />
            <span
              className={`${monoClass} text-[10px] tracking-wider uppercase text-[#DDC49B]`}
            >
              2,400+ enterprise procurement teams
            </span>
          </div>

          <h2
            className={`${displayClass} text-[2.5rem] font-medium leading-[1.1] tracking-tight mb-4`}
          >
            Unified Identity.
            <br />
            <span className="italic text-[#C9A876]">Enterprise Security.</span>
          </h2>
          <p className="text-base text-[#AEBBCB] leading-relaxed max-w-sm mb-6">
            Scryme provides single sign-on, passkey authentication, and secure
            OAuth2 delegation for all enterprise services.
          </p>

          <VerificationLedger />

          {/* Stats row */}
          <div className="flex gap-8 mt-8 pt-8 border-t border-white/10">
            <StatCard value="7,200+" label="Vetted vendors" />
            <StatCard value="94%" label="Audit pass rate" />
            <StatCard value="3 days" label="Time to approval" />
          </div>
        </div>
      </div>
    </div>
  );
}
