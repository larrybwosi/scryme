import React, { useEffect, useState } from "react";
import { useSearch } from "@tanstack/react-router";
import { authClient, consentOAuth2 } from "@/lib/auth-client";
import { Shield, Check, X, AlertCircle, Loader2, Building2, Key, Bot } from "lucide-react";
import { toast } from "sonner";

interface OrganizationItem {
  id: string;
  name: string;
  slug?: string;
  logo?: string;
}

export function ConsentPage() {
  const searchParams = useSearch({ strict: false }) as Record<string, string | undefined>;
  const [loading, setLoading] = useState(false);
  const [clientInfo, setClientInfo] = useState<{ clientName?: string } | null>(null);

  const { data: session, isPending } = authClient.useSession();

  const clientId = searchParams?.client_id;
  const scopeStr = searchParams?.scope || "openid profile email mcp:read mcp:write org_info";
  const initialScopes = scopeStr.split(" ").filter(Boolean);

  const [organizations, setOrganizations] = useState<OrganizationItem[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");
  const [selectedScopes, setSelectedScopes] = useState<string[]>(initialScopes);
  const [loadingOrgs, setLoadingOrgs] = useState(false);

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

  // Fetch available organizations for the user
  useEffect(() => {
    async function fetchOrganizations() {
      if (!session?.user) return;
      setLoadingOrgs(true);
      try {
        const res = await fetch("/api/auth/organization/list", {
          headers: { "Content-Type": "application/json" },
        });
        if (res.ok) {
          const data = await res.json();
          const orgList = Array.isArray(data) ? data : data?.organizations || data?.data || [];
          setOrganizations(orgList);

          const defaultOrgId =
            (session.session as any)?.activeOrganizationId ||
            (session.user as any)?.activeOrganizationId ||
            orgList[0]?.id ||
            "";
          setSelectedOrgId(defaultOrgId);
        }
      } catch (err) {
        console.error("Failed to load organizations:", err);
      } finally {
        setLoadingOrgs(false);
      }
    }

    fetchOrganizations();
  }, [session]);

  const toggleScope = (scope: string) => {
    if (selectedScopes.includes(scope)) {
      setSelectedScopes(selectedScopes.filter((s) => s !== scope));
    } else {
      setSelectedScopes([...selectedScopes, scope]);
    }
  };

  const handleConsentResponse = async (accept: boolean) => {
    setLoading(true);
    try {
      if (accept && selectedOrgId) {
        // Switch active organization if needed
        try {
          await fetch("/api/auth/organization/set-active", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ organizationId: selectedOrgId }),
          });
        } catch (orgErr) {
          console.warn("Could not set active organization before consent:", orgErr);
        }
      }

      const res = await authClient.oauth2.consent({
        accept,
        scope: selectedScopes.join(" "),
      });

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

  const scopeLabels: Record<string, { title: string; desc: string }> = {
    "mcp:read": {
      title: "MCP Read Access",
      desc: "Read real-time inventory, products, orders, sales, and analytics.",
    },
    "mcp:write": {
      title: "MCP Write & Action Access",
      desc: "Execute catalog updates, product creation, and inventory sync.",
    },
    org_info: {
      title: "Organization Profile",
      desc: "View organization name, branding, and workspace configuration.",
    },
    membership: {
      title: "Membership Roles",
      desc: "View user member roles and access permissions within workspace.",
    },
    profile: {
      title: "User Profile",
      desc: "Access user full name, avatar, and username.",
    },
    email: {
      title: "Primary Email",
      desc: "Access verified email address.",
    },
  };

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#E7E2D9]">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#0F1B2E] flex items-center justify-center text-white font-bold text-[#DDC49B] shadow-sm">
            S
          </div>
          <div>
            <span className="text-[#0F1B2E] font-bold text-lg tracking-tight block leading-none">
              Scryme
            </span>
            <span className="text-[10px] font-mono text-[#A9824C] uppercase tracking-wider block mt-0.5">
              OAuth2 & MCP Authorization
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#A9824C]/10 border border-[#A9824C]/20 rounded-full text-[10px] font-mono text-[#8A6A3E]">
          <Shield className="w-3 h-3 text-[#A9824C]" />
          <span>Delegated Access</span>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#A9824C] uppercase tracking-wider mb-1">
          <Bot className="w-4 h-4" /> Model & App Authentication
        </div>
        <h1 className="font-serif text-2xl font-medium text-[#0F1B2E] leading-tight">
          Authorize Application
        </h1>
        <p className="text-[#5B6B7C] text-xs mt-1.5 leading-relaxed">
          <strong className="text-[#0F1B2E]">{clientInfo?.clientName || clientId}</strong> requests permission to access your Scryme workspace data.
        </p>
      </div>

      {/* Target Organization Selector */}
      <div className="mb-6 bg-[#E7E2D9]/30 border border-[#E7E2D9] rounded-xl p-4 space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#5B6B7C] flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-[#0F1B2E]" /> Target Workspace / Organization
          </label>
          {loadingOrgs && <Loader2 className="w-3 h-3 animate-spin text-[#A9824C]" />}
        </div>

        {organizations.length > 0 ? (
          <select
            value={selectedOrgId}
            onChange={(e) => setSelectedOrgId(e.target.value)}
            className="w-full h-10 px-3 bg-white border border-[#E7E2D9] text-[#0F1B2E] font-medium text-xs rounded-lg focus:outline-none focus:border-[#0F1B2E]"
          >
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name} {org.slug ? `(${org.slug})` : ""}
              </option>
            ))}
          </select>
        ) : (
          <div className="text-xs text-[#0F1B2E] font-medium p-2 bg-white rounded border border-[#E7E2D9]">
            {(session?.session as any)?.activeOrganizationId || (session?.user as any)?.activeOrganizationId ? (
              <span className="font-mono text-[11px]">
                Current Active Organization ID: {(session?.session as any)?.activeOrganizationId || (session?.user as any)?.activeOrganizationId}
              </span>
            ) : (
              <span className="text-[#5B6B7C]">Primary Organization Account</span>
            )}
          </div>
        )}
      </div>

      {/* Scope Toggles */}
      <div className="bg-[#E7E2D9]/30 border border-[#E7E2D9] rounded-xl p-4 mb-6 space-y-3">
        <p className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#5B6B7C] flex items-center gap-1.5">
          <Key className="w-3.5 h-3.5 text-[#0F1B2E]" /> Requested Permissions
        </p>
        <div className="space-y-2">
          {initialScopes.map((scope) => {
            const label = scopeLabels[scope] || {
              title: scope.replace(/_/g, " ").replace(/:/g, " "),
              desc: `Grant permission for ${scope}`,
            };
            const isChecked = selectedScopes.includes(scope);

            return (
              <div
                key={scope}
                onClick={() => toggleScope(scope)}
                className={`p-3 rounded-lg border transition-all cursor-pointer flex items-start gap-3 ${
                  isChecked
                    ? "bg-white border-[#0F1B2E]/30 shadow-xs"
                    : "bg-white/50 border-transparent opacity-60 hover:opacity-100"
                }`}
              >
                <div
                  className={`mt-0.5 h-4 w-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                    isChecked
                      ? "bg-[#0F1B2E] border-[#0F1B2E] text-white"
                      : "border-[#9AA6B2] bg-white"
                  }`}
                >
                  {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-[#0F1B2E] capitalize">
                    {label.title}
                  </div>
                  <div className="text-[11px] text-[#5B6B7C] leading-snug mt-0.5">
                    {label.desc}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2.5">
        <button
          onClick={() => handleConsentResponse(true)}
          disabled={loading || selectedScopes.length === 0}
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
              Authorize Access ({selectedScopes.length} Scopes)
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
        By authorizing, you allow this model / app to access your organization workspace in accordance with your specified permissions.
      </p>
    </div>
  );
}
