import React, { useEffect } from "react";
import { useSession } from "../lib/auth-client";
import { Sparkles, Loader2 } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
}

function getAuthUrl(): string {
  if (typeof window !== "undefined") {
    const viteAuthUrl = (import.meta as any).env?.VITE_AUTH_URL || (import.meta as any).env?.VITE_PUBLIC_AUTH_URL;
    if (viteAuthUrl && typeof viteAuthUrl === "string" && viteAuthUrl.trim() !== "" && !viteAuthUrl.includes("PLACEHOLDER")) {
      return viteAuthUrl.trim();
    }
    const isDev = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    return isDev ? "http://localhost:4444" : "https://auth.scryme.tech";
  }
  return "https://auth.scryme.tech";
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { data: sessionData, isPending, error } = useSession();

  useEffect(() => {
    if (!isPending && (!sessionData || !sessionData.session || error)) {
      if (typeof window !== "undefined") {
        const currentUrl = window.location.href;
        const authBase = getAuthUrl();
        const loginUrl = `${authBase}/sign-in?callbackUrl=${encodeURIComponent(currentUrl)}`;
        window.location.href = loginUrl;
      }
    }
  }, [isPending, sessionData, error]);

  if (isPending) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 antialiased font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 animate-pulse">
            <Sparkles className="h-6 w-6" />
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-400 font-medium">
            <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
            <span>Verifying workspace session...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!sessionData || !sessionData.session || error) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 antialiased font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <Sparkles className="h-6 w-6" />
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-400 font-medium">
            <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
            <span>Redirecting to authentication...</span>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
