import React, { useState } from "react";
import { Building2, ArrowRight, ShieldCheck, Globe } from "lucide-react";
import { buildCustomerTenantUrl } from "../lib/tenant";

interface OrgSelectorProps {
  initialSlug?: string;
}

export function OrgSelector({ initialSlug = "" }: OrgSelectorProps) {
  const [slug, setSlug] = useState(initialSlug);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSlug = slug.trim().toLowerCase().replace(/[^a-z0-9-_]/g, "");
    if (!cleanSlug) {
      setError("Please enter a valid organization slug or workspace ID.");
      return;
    }
    setError(null);
    const targetUrl = buildCustomerTenantUrl(cleanSlug);
    window.location.href = targetUrl;
  };

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#E7E2D9]">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-none bg-[#0F1B2E] flex items-center justify-center text-white font-bold text-[#DDC49B] shadow-sm">
            S
          </div>
          <div>
            <span className="text-[#0F1B2E] font-bold text-lg tracking-tight block leading-none">
              Scryme
            </span>
            <span className="text-[10px] font-mono text-[#A9824C] uppercase tracking-wider block mt-0.5">
              Customer Identity Portal
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#A9824C]/10 border border-[#A9824C]/20 rounded-none text-[10px] font-mono text-[#8A6A3E]">
          <ShieldCheck className="w-3 h-3 text-[#A9824C]" />
          <span>Tenant Gateway</span>
        </div>
      </div>

      <div className="mb-6">
        <h1 className="font-serif text-[1.9rem] font-medium text-[#0F1B2E] leading-tight tracking-tight">
          Enter your organization
        </h1>
        <p className="text-[#5B6B7C] text-sm mt-1.5 leading-relaxed">
          Provide your organization's workspace slug to access your dedicated customer portal.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-3.5 rounded-none bg-[#B3352A]/10 border border-[#B3352A]/20 flex items-start gap-2.5 text-[#B3352A] text-xs font-medium animate-in fade-in duration-150">
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#33404D] mb-1.5">
            Organization Slug
          </label>
          <div className="relative">
            <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9AA6B2]" />
            <input
              type="text"
              required
              autoFocus
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="e.g. acme or scryme"
              className="w-full h-11 pl-10 pr-3.5 bg-white border border-[#E7E2D9] rounded-none text-sm text-[#0F1B2E] placeholder-[#9AA6B2] focus:outline-none focus:ring-1 focus:ring-[#A9824C] focus:border-[#A9824C] transition-all font-mono"
            />
          </div>
          <p className="text-[11px] text-[#5B6B7C] mt-1.5">
            You will be redirected to <span className="font-mono text-[#0F1B2E] font-medium">{slug ? slug.toLowerCase().replace(/[^a-z0-9-_]/g, "") : "<org>"}.customers.auth.scryme.tech</span>
          </p>
        </div>

        <button
          type="submit"
          className="w-full h-11 bg-[#0F1B2E] hover:bg-[#16283F] text-white font-semibold rounded-none transition-all duration-150 shadow-sm flex items-center justify-center gap-2 group mt-2 cursor-pointer"
        >
          <span>Continue to Portal</span>
          <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </form>
    </div>
  );
}
