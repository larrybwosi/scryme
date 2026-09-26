import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { authClient, consentOAuth2 } from "@/lib/auth-client";
import { Shield, Check, X, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function ConsentPage() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [clientInfo, setClientInfo] = useState<{ clientName?: string; logo?: string } | null>(null);

  const { data: session, isPending } = authClient.useSession();

  const clientId = searchParams.get("client_id");
  const scopeStr = searchParams.get("scope") || "";
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
      <div className="w-full max-w-md p-8 bg-card border border-border/60 rounded-2xl shadow-xl text-center">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h1 className="text-xl font-bold mb-2">Invalid Authorization Request</h1>
        <p className="text-sm text-muted-foreground">
          Missing client identifier in OAuth request.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md p-8 bg-card border border-border/60 rounded-2xl shadow-xl backdrop-blur-sm">
      <div className="flex flex-col items-center text-center mb-6">
        <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4 border border-primary/20">
          <Shield className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Authorize App</h1>
        <p className="text-sm text-muted-foreground mt-1.5">
          <strong className="text-foreground">{clientInfo?.clientName || clientId}</strong> is requesting access to your Scryme account.
        </p>
      </div>

      <div className="bg-muted/40 rounded-xl p-4 border border-border/50 mb-6 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Requested Permissions:
        </p>
        <ul className="space-y-2 text-sm">
          {scopes.map((scope) => (
            <li key={scope} className="flex items-center gap-2.5 text-foreground font-medium">
              <div className="h-5 w-5 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Check className="h-3.5 w-3.5" />
              </div>
              <span className="capitalize">{scope.replace("_", " ")}</span>
            </li>
          ))}
          {scopes.length === 0 && (
            <li className="text-muted-foreground text-xs italic">Basic profile information</li>
          )}
        </ul>
      </div>

      <div className="flex flex-col gap-3">
        <button
          onClick={() => handleConsentResponse(true)}
          disabled={loading}
          className="w-full py-2.5 px-4 bg-primary text-primary-foreground font-semibold rounded-xl text-sm hover:opacity-90 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Check className="h-4 w-4" />
              Authorize Access
            </>
          )}
        </button>

        <button
          onClick={() => handleConsentResponse(false)}
          disabled={loading}
          className="w-full py-2.5 px-4 bg-secondary text-secondary-foreground font-semibold rounded-xl text-sm hover:bg-secondary/80 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <X className="h-4 w-4" />
          Deny
        </button>
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        By authorizing, you allow this application to access your information in accordance with their privacy policy and terms.
      </p>
    </div>
  );
}
