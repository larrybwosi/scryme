import React, { useEffect } from "react";
import { useSearch } from "@tanstack/react-router";
import { Loader2, CheckCircle2, AlertCircle, Smartphone } from "lucide-react";

export function MobileCallbackPage() {
  const searchParams = useSearch({ strict: false }) as Record<string, string | undefined>;
  const code = searchParams?.code;
  const error = searchParams?.error;
  const errorDescription = searchParams?.error_description;

  useEffect(() => {
    const params = new URLSearchParams();
    if (code) params.set("code", code);
    if (error) params.set("error", error);
    if (errorDescription) params.set("error_description", errorDescription);

    const customSchemeUri = `scryme://oauth/callback?${params.toString()}`;

    // Attempt custom scheme redirect for fallback if Android App Link didn't catch the HTTP URL
    const timer = setTimeout(() => {
      window.location.href = customSchemeUri;
    }, 500);

    return () => clearTimeout(timer);
  }, [code, error, errorDescription]);

  const handleOpenApp = () => {
    const params = new URLSearchParams();
    if (code) params.set("code", code);
    if (error) params.set("error", error);
    if (errorDescription) params.set("error_description", errorDescription);

    window.location.href = `scryme://oauth/callback?${params.toString()}`;
  };

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-2 duration-300 text-center py-6">
      <div className="flex justify-center mb-6">
        <div className="w-16 h-16 rounded-2xl bg-[#0F1B2E] flex items-center justify-center text-[#DDC49B] shadow-md">
          <Smartphone className="w-8 h-8 text-[#A9824C]" />
        </div>
      </div>

      {error ? (
        <>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#B3352A]/10 border border-[#B3352A]/20 rounded-full text-xs font-mono text-[#B3352A] mb-4">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Authentication Error</span>
          </div>
          <h1 className="font-serif text-2xl font-medium text-[#0F1B2E] mb-2">
            Authorization Failed
          </h1>
          <p className="text-sm text-[#5B6B7C] max-w-sm mx-auto mb-6">
            {errorDescription || error || "An error occurred during authentication."}
          </p>
        </>
      ) : (
        <>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#4FA871]/10 border border-[#4FA871]/20 rounded-full text-xs font-mono text-[#4FA871] mb-4">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#4FA871]" />
            <span>Authenticated Successfully</span>
          </div>
          <h1 className="font-serif text-2xl font-medium text-[#0F1B2E] mb-2">
            Redirecting to Scryme App…
          </h1>
          <p className="text-sm text-[#5B6B7C] max-w-sm mx-auto mb-6">
            Your login was verified. We are returning you to the Scryme Android application.
          </p>
          <div className="flex items-center justify-center gap-2 text-xs font-mono text-[#A9824C] mb-6 uppercase tracking-wider">
            <Loader2 className="w-4 h-4 animate-spin text-[#A9824C]" />
            <span>Completing Handshake</span>
          </div>
        </>
      )}

      <button
        onClick={handleOpenApp}
        className="w-full h-11 bg-[#0F1B2E] hover:bg-[#16283F] text-white font-semibold text-xs rounded-lg transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer max-w-xs mx-auto"
      >
        <span>Open Scryme App</span>
      </button>
    </div>
  );
}
