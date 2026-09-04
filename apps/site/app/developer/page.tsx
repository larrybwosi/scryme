"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Key,
  Shield,
  Code2,
  Lock,
  Terminal,
  Webhook,
  ArrowRight,
  CheckCircle2,
  Copy,
  Check,
  Zap,
  Cpu,
  Globe,
  Database,
  Layers,
  Sparkles,
  BookOpen,
  LayoutDashboard,
  UserCheck,
} from "lucide-react";
import { colors, fonts } from "@/lib/scryme-tokens";

export default function DeveloperPage() {
  const [copiedCode, setCopiedCode] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<"ts" | "curl" | "rust">("ts");

  const sampleTsCode = `import { ScrymeClientSDK } from "@scryme/sdk";

// Initialize Scryme Client with OAuth 2.0 or V3 Client ID
const scryme = new ScrymeClientSDK({
  clientId: "v3_app_84920a1f9e83b21c",
  orgSlug: "acme-corp",
});

// Trigger 'Sign in with Scryme' OAuth Flow
export async function handleSignInWithScryme() {
  const { url, state } = await scryme.customer.auth.getOAuthLoginUrl({
    scopes: ["user.profile", "user.email", "orders.read"],
    redirectUri: "https://yourapp.com/auth/callback",
  });

  window.location.href = url;
}`;

  const sampleCurlCode = `curl -X POST https://api.scryme.tech/v3/auth/oauth2/token \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  -d "grant_type=authorization_code" \\
  -d "client_id=v3_app_84920a1f9e83b21c" \\
  -d "client_secret=scryme_sec_994a20b..." \\
  -d "code=auth_code_xyz123" \\
  -d "redirect_uri=https://yourapp.com/auth/callback"`;

  const sampleRustCode = `use scryme_sdk::{ScrymeClient, Configuration};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let mut config = Configuration::new();
    config.base_path = "https://api.scryme.tech".to_string();

    let client = ScrymeClient::new(config);
    let session = client.auth().verify_oauth_code("auth_code_xyz123").await?;
    println!("Authenticated developer user: {:?}", session.user.email);
    Ok(())
}`;

  const copyCode = () => {
    const codeMap = {
      ts: sampleTsCode,
      curl: sampleCurlCode,
      rust: sampleRustCode,
    };
    navigator.clipboard.writeText(codeMap[selectedLanguage]);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div
      className="min-h-screen pt-24 pb-20 text-[#F1E9D8]"
      style={{
        background: `radial-gradient(circle at 50% 0%, rgba(200, 154, 75, 0.08) 0%, ${colors.inkBg} 60%)`,
        fontFamily: fonts.body,
      }}
    >
      {/* Hero Section */}
      <section className="container mx-auto px-4 lg:px-8 pt-6 pb-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide border mb-6 bg-[rgba(200,154,75,0.08)] border-[rgba(200,154,75,0.3)] text-[#C89A4B]">
            <Sparkles size={14} />
            <span style={{ fontFamily: fonts.mono }}>DEVS HUB & OAUTH 2.0 INFRASTRUCTURE</span>
          </div>
          <h1
            className="text-4xl md:text-6xl font-bold tracking-tight mb-6 leading-[1.15]"
            style={{ fontFamily: fonts.display, color: colors.textPrimary }}
          >
            Build next-gen apps with <br className="hidden sm:inline" />
            <span className="text-[#C89A4B]">&quot;Sign in with Scryme&quot;</span> &amp; APIs
          </h1>
          <p className="text-lg md:text-xl text-[rgba(241,233,216,0.7)] max-w-2xl mx-auto mb-10 leading-relaxed">
            Empower your application with multi-tenant identity authorization, V3 API Keys, webhooks, and official client SDKs for TypeScript and Rust.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/developer/dashboard"
              className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm transition-all hover:scale-[1.02] bg-[#C89A4B] text-[#0B1220] shadow-[0_0_24px_rgba(200,154,75,0.3)]"
            >
              <LayoutDashboard size={17} />
              <span>Open Developer Console</span>
            </Link>
            <Link
              href="/developer/register"
              className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm border transition-all hover:bg-[rgba(241,233,216,0.06)] border-[rgba(241,233,216,0.2)] text-[#F1E9D8]"
            >
              <UserCheck size={17} />
              <span>Register Developer Account</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Code Showcase Widget */}
      <section className="container mx-auto px-4 lg:px-8 py-10">
        <div className="max-w-4xl mx-auto rounded-lg border bg-[#121B2E] border-[rgba(241,233,216,0.12)] shadow-xl overflow-hidden">
          {/* Code Header Bar */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-[rgba(241,233,216,0.1)] bg-[#0B1220]">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 mr-3">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
              </div>
              <div className="flex items-center gap-1 bg-[#162238] p-1 rounded-md border border-[rgba(241,233,216,0.08)]">
                {(["ts", "curl", "rust"] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setSelectedLanguage(lang)}
                    className={`px-3 py-1 rounded text-xs font-mono font-medium transition-colors ${
                      selectedLanguage === lang
                        ? "bg-[#C89A4B] text-[#0B1220]"
                        : "text-[rgba(241,233,216,0.6)] hover:text-[#F1E9D8]"
                    }`}
                  >
                    {lang === "ts" ? "TypeScript SDK" : lang === "curl" ? "cURL" : "Rust SDK"}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={copyCode}
              className="flex items-center gap-1.5 text-xs text-[rgba(241,233,216,0.6)] hover:text-[#C89A4B] transition-colors"
            >
              {copiedCode ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              <span>{copiedCode ? "Copied!" : "Copy Snippet"}</span>
            </button>
          </div>

          {/* Code Window */}
          <div className="p-6 overflow-x-auto bg-[#090E1A]">
            <pre className="text-xs font-mono text-[rgba(241,233,216,0.9)] leading-relaxed">
              <code>
                {selectedLanguage === "ts" && sampleTsCode}
                {selectedLanguage === "curl" && sampleCurlCode}
                {selectedLanguage === "rust" && sampleRustCode}
              </code>
            </pre>
          </div>
        </div>
      </section>

      {/* Core Platform Features */}
      <section className="container mx-auto px-4 lg:px-8 py-16">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: fonts.display }}>
            Everything you need for seamless authorization
          </h2>
          <p className="text-[rgba(241,233,216,0.7)] text-sm">
            Plug into Scryme identity, retail APIs, and data engine with developer-grade security and developer tools.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* Card 1: Sign in with Scryme */}
          <div className="p-6 rounded-lg bg-[#121B2E] border border-[rgba(241,233,216,0.1)] hover:border-[rgba(200,154,75,0.4)] transition-all">
            <div className="w-9 h-9 rounded-md bg-[rgba(200,154,75,0.1)] border border-[rgba(200,154,75,0.25)] flex items-center justify-center text-[#C89A4B] mb-5">
              <Lock size={18} />
            </div>
            <h3 className="text-lg font-bold mb-2">Sign in with Scryme</h3>
            <p className="text-xs text-[rgba(241,233,216,0.65)] leading-relaxed mb-4">
              Implement OAuth 2.0 / OpenID Connect authentication so your customers can log into your third-party applications with their unified Scryme identity.
            </p>
            <ul className="space-y-2 text-xs text-[rgba(241,233,216,0.8)]">
              <li className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-[#C89A4B]" /> PKCE & Authorization Code flow
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-[#C89A4B]" /> Granular scope consent controls
              </li>
            </ul>
          </div>

          {/* Card 2: V3 API Credentials */}
          <div className="p-6 rounded-lg bg-[#121B2E] border border-[rgba(241,233,216,0.1)] hover:border-[rgba(200,154,75,0.4)] transition-all">
            <div className="w-9 h-9 rounded-md bg-[rgba(200,154,75,0.1)] border border-[rgba(200,154,75,0.25)] flex items-center justify-center text-[#C89A4B] mb-5">
              <Key size={18} />
            </div>
            <h3 className="text-lg font-bold mb-2">V3 API Keys Management</h3>
            <p className="text-xs text-[rgba(241,233,216,0.65)] leading-relaxed mb-4">
              Provision environment-scoped API keys for Live and Test environments. Issue timing-safe encrypted keys for server-to-server microservices.
            </p>
            <ul className="space-y-2 text-xs text-[rgba(241,233,216,0.8)]">
              <li className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-[#C89A4B]" /> Instant key rotation & revocation
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-[#C89A4B]" /> CORS origin authorization lists
              </li>
            </ul>
          </div>

          {/* Card 3: Realtime Webhooks */}
          <div className="p-6 rounded-lg bg-[#121B2E] border border-[rgba(241,233,216,0.1)] hover:border-[rgba(200,154,75,0.4)] transition-all">
            <div className="w-9 h-9 rounded-md bg-[rgba(200,154,75,0.1)] border border-[rgba(200,154,75,0.25)] flex items-center justify-center text-[#C89A4B] mb-5">
              <Webhook size={18} />
            </div>
            <h3 className="text-lg font-bold mb-2">Event Webhook Subscriptions</h3>
            <p className="text-xs text-[rgba(241,233,216,0.65)] leading-relaxed mb-4">
              Subscribe to enterprise events like `order.created`, `stock.reconciled`, or `user.authenticated` with HMAC SHA-256 signatures.
            </p>
            <ul className="space-y-2 text-xs text-[rgba(241,233,216,0.8)]">
              <li className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-[#C89A4B]" /> HMAC SHA-256 signature verification
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-[#C89A4B]" /> Automatic retry logic & delivery logs
              </li>
            </ul>
          </div>

          {/* Card 4: Official Client SDKs */}
          <div className="p-6 rounded-lg bg-[#121B2E] border border-[rgba(241,233,216,0.1)] hover:border-[rgba(200,154,75,0.4)] transition-all">
            <div className="w-9 h-9 rounded-md bg-[rgba(200,154,75,0.1)] border border-[rgba(200,154,75,0.25)] flex items-center justify-center text-[#C89A4B] mb-5">
              <Code2 size={18} />
            </div>
            <h3 className="text-lg font-bold mb-2">TypeScript & Rust SDKs</h3>
            <p className="text-xs text-[rgba(241,233,216,0.65)] leading-relaxed mb-4">
              Accelerate integration using zero-dependency, auto-generated SDK packages `@scryme/sdk` and `scryme-sdk` for Rust native apps.
            </p>
            <ul className="space-y-2 text-xs text-[rgba(241,233,216,0.8)]">
              <li className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-[#C89A4B]" /> End-to-end OpenAPI TypeScript types
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-[#C89A4B]" /> High-performance Rust async client
              </li>
            </ul>
          </div>

          {/* Card 5: Enterprise Security */}
          <div className="p-6 rounded-lg bg-[#121B2E] border border-[rgba(241,233,216,0.1)] hover:border-[rgba(200,154,75,0.4)] transition-all">
            <div className="w-9 h-9 rounded-md bg-[rgba(200,154,75,0.1)] border border-[rgba(200,154,75,0.25)] flex items-center justify-center text-[#C89A4B] mb-5">
              <Shield size={18} />
            </div>
            <h3 className="text-lg font-bold mb-2">Multi-Tenant Isolation</h3>
            <p className="text-xs text-[rgba(241,233,216,0.65)] leading-relaxed mb-4">
              Strict organization boundary checks prevent unauthorized cross-tenant data access across all API endpoints and token validation procedures.
            </p>
            <ul className="space-y-2 text-xs text-[rgba(241,233,216,0.8)]">
              <li className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-[#C89A4B]" /> Timing-safe constant-time hash checks
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-[#C89A4B]" /> Built-in rate limiting & IP whitelisting
              </li>
            </ul>
          </div>

          {/* Card 6: Interactive Developer Console */}
          <div className="p-6 rounded-lg bg-[#121B2E] border border-[rgba(241,233,216,0.1)] hover:border-[rgba(200,154,75,0.4)] transition-all">
            <div className="w-9 h-9 rounded-md bg-[rgba(200,154,75,0.1)] border border-[rgba(200,154,75,0.25)] flex items-center justify-center text-[#C89A4B] mb-5">
              <Terminal size={18} />
            </div>
            <h3 className="text-lg font-bold mb-2">Developer Portal Console</h3>
            <p className="text-xs text-[rgba(241,233,216,0.65)] leading-relaxed mb-4">
              Self-service portal to create apps, view request logs, test OAuth callback authorization, and monitor API quotas in real time.
            </p>
            <ul className="space-y-2 text-xs text-[rgba(241,233,216,0.8)]">
              <li className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-[#C89A4B]" /> Full lifecycle key & client management
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-[#C89A4B]" /> Live request analytics & audit trails
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA Footer Section */}
      <section className="container mx-auto px-4 lg:px-8 pt-12">
        <div className="max-w-4xl mx-auto p-8 rounded-lg border bg-gradient-to-r from-[#162238] to-[#0D1627] border-[rgba(200,154,75,0.3)] text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3" style={{ fontFamily: fonts.display }}>
            Ready to integrate &quot;Sign in with Scryme&quot;?
          </h2>
          <p className="text-xs md:text-sm text-[rgba(241,233,216,0.7)] max-w-xl mx-auto mb-6">
            Create your free developer workspace, generate OAuth Client credentials, and test your authentication flow in minutes.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/developer/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm bg-[#C89A4B] text-[#0B1220] transition-colors hover:bg-[#d4a859]"
            >
              <span>Go to Developer Dashboard</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
