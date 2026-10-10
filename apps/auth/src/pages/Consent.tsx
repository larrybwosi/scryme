import React, { useEffect, useState } from "react";
import { useSearch } from "@tanstack/react-router";
import { authClient, consentOAuth2 } from "@/lib/auth-client";
import { Shield, Check, X, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function ConsentPage() {
  const searchParams = useSearch({ strict: false }) as Record<string, string | undefined>;
  const [loading, setLoading] = useState(false);
  const [clientInfo, setClientInfo] = useState<{ clientName?: string } | null>(null);

  const { data: session, isPending } = authClient.useSession();

  const clientId = searchParams?.client_id;
  const scopeStr = searchParams?.scope || "";
  const scopes = scopeStr.split(" ").filter(Boolean);

  useEffect(() => {
    if (!isPending && !session && clientId) {
      const currentUrl = window.location.pathname + window.location.search;
      window.location.href = `/sign-in?callbackUrl=${encodeURIComponent(currentUrl)}`;
    }
  }, [session, isPending, clientId]);

  useEffect(() => {
    if (clientId) {
      setClientInfo({
        clientName: clientId.charAt(0).toUpperCase() + clientId.slice(1),
      });
    }
  }, [clientId]);

  const handleConsentResponse = async (accept: boolean) => {
    setLoading(true);
    try {
      const res = await consentOAuth2(accept);

      const redirectUrl =
        res?.data?.url ||
        (typeof res?.data?.redirect === "string" ? res.data.redirect : null) ||
        (res?.data as any)?.url ||
        (res?.data as any)?.redirectUrl;

      if (redirectUrl) {
        window.location.href = redirectUrl;
      } else if (res?.error) {
        toast.error(res.error.message || "Failed to process consent choice");
      }
    } catch (err: any) {
      toast.error("An unexpected error occurred processing authorization.");
    } finally {
      setLoading(false);
    }
  };

  if (!clientId) {
    return (
      <div className="w-full text-center py-6">
        <AlertCircle className="h-10 w-10 text-[#B3352A] mx-auto mb-3" />
        <h1 className="font-serif text-xl font-medium text-[#0F1B2E] mb-1">
          Invalid Request
        </h1>
        <p className="text-xs text-[#5B6B7C]">
          Missing client identifier in OAuth authorization request.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#E7E2D9]">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#0F1B2E] flex items-center justify-center text-white font-bold text-[#DDC49B] shadow-sm">
            S
          </div>
          <div>
            <span className="text-[#0F1B2E] font-bold text-lg tracking-tight block leading-none">
              Scryme
            </span>
            <span className="text-[10px] font-mono text-[#A9824C] uppercase tracking-wider block mt-0.5">
              OAuth2 Consent
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#A9824C]/10 border border-[#A9824C]/20 rounded-full text-[10px] font-mono text-[#8A6A3E]">
          <Shield className="w-3 h-3 text-[#A9824C]" />
          <span>Delegated Access</span>
        </div>
      </div>

      <div className="mb-6">
        <h1 className="font-serif text-[1.8rem] font-medium text-[#0F1B2E] leading-tight">
          Authorize Application
        </h1>
        <p className="text-[#5B6B7C] text-sm mt-1.5 leading-relaxed">
          <strong className="text-[#0F1B2E]">{clientInfo?.clientName || clientId}</strong> is requesting authorization to access your Scryme account.
        </p>
      </div>

      <div className="bg-[#E7E2D9]/30 border border-[#E7E2D9] rounded-lg p-4 mb-6 space-y-3">
        <p className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#5B6B7C]">
          Requested Permissions & Scopes
        </p>
        <ul className="space-y-2 text-xs text-[#0F1B2E]">
          {scopes.map((scope) => (
            <li key={scope} className="flex items-center gap-2 font-medium">
              <div className="h-4 w-4 rounded bg-[#4FA871]/15 text-[#4FA871] flex items-center justify-center shrink-0">
                <Check className="h-3 w-3" />
              </div>
              <span className="capitalize">{scope.replace("_", " ")}</span>
            </li>
          ))}
          {scopes.length === 0 && (
            <li className="text-[#9AA6B2] text-xs italic">Basic profile & email information</li>
          )}
        </ul>
      </div>

      <div className="flex flex-col gap-2.5">
        <button
          onClick={() => handleConsentResponse(true)}
          disabled={loading}
          className="w-full h-11 bg-[#0F1B2E] hover:bg-[#16283F] text-white font-semibold text-xs rounded-lg transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Authorizing…
            </>
          ) : (
            <>
              <Check className="h-4 w-4 text-[#4FA871]" />
              Authorize Access
            </>
          )}
        </button>

        <button
          onClick={() => handleConsentResponse(false)}
          disabled={loading}
          className="w-full h-10 border border-[#E7E2D9] bg-white hover:bg-[#F2EFE9] text-[#0F1B2E] font-semibold text-xs rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          <X className="h-4 w-4 text-[#B3352A]" />
          Deny Request
        </button>
      </div>

      <p className="mt-6 text-center text-[11px] text-[#9AA6B2] leading-relaxed">
        By authorizing, you allow this application to access your information in accordance with their privacy policy and terms of service.
      </p>
    </div>
  );
}
