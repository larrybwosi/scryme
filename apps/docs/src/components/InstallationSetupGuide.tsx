// components/InstallationSetupGuide.tsx
import React from "react";
import { Download, Terminal, Settings, Key, BookOpen, Workflow } from "lucide-react";

// --- Component Props ---
interface InstallationSetupGuideProps {
  renderHighlightedCode: (code: string, language: string) => JSX.Element;
}

/**
 * Installation & Setup Guide Component
 *
 * Documents how to install, configure, and initialize the Scryme V3 SDK in Node.js applications.
 *
 * @component
 * @param {Object} props - Component props
 * @param {Function} props.renderHighlightedCode - Function to render syntax-highlighted code
 */
export default function InstallationSetupGuide({
  renderHighlightedCode,
}: InstallationSetupGuideProps) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 text-xs text-brass uppercase tracking-wider font-semibold mb-2">
          <span>Developer Guide</span>
          <span>&bull;</span>
          <span>SDK Installation & Setup</span>
        </div>
        <h1 className="text-3xl font-extrabold text-paper leading-tight">
          Installation & Setup Guide
        </h1>
        <p className="text-light-text text-sm mt-2 leading-relaxed">
          The official Scryme V3 SDK is the recommended way to integrate your Node.js, Next.js, and backend applications with the Scryme platform. It offers complete end-to-end type safety, auto-generated DTO wrappers, and automatic organization scoping.
        </p>
      </div>

      {/* Conceptual Card */}
      <div className="bg-ink-card/50 rounded-xl border border-ink-border p-5 space-y-3">
        <div className="flex items-center gap-2 text-brass font-bold text-sm">
          <Download size={16} />
          <span>Why use the SDK?</span>
        </div>
        <p className="text-xs text-light-text leading-relaxed">
          Instead of writing direct <code className="text-paper">fetch</code> or <code className="text-paper">axios</code> requests manually—which can lead to runtime type mismatches, missing organization tenant contexts, or error handling oversights—utilizing the Scryme V3 SDK guarantees compile-time schema conformance and resilient token refreshing.
        </p>
      </div>

      {/* Installation Methods */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-paper border-b border-ink-border pb-2 flex items-center gap-2">
          <Terminal size={18} className="text-brass" />
          <span>Package Installation</span>
        </h2>
        <p className="text-xs text-light-text leading-relaxed">
          The Scryme V3 SDK is published within our private monorepo workspace and can be added to any of your service applications using your package manager of choice:
        </p>

        <div className="space-y-3">
          <div className="space-y-1.5 text-left">
            <span className="text-[10px] font-bold text-light-text block">PNPM (Recommended):</span>
            <div className="relative group rounded-xl overflow-hidden bg-ink-bg border border-ink-border p-3.5 text-xs font-mono shadow-sm">
              <pre className="overflow-x-auto text-emerald-400">
                <code>pnpm add @scryme/sdk</code>
              </pre>
            </div>
          </div>

          <div className="space-y-1.5 text-left">
            <span className="text-[10px] font-bold text-light-text block">NPM:</span>
            <div className="relative group rounded-xl overflow-hidden bg-ink-bg border border-ink-border p-3.5 text-xs font-mono shadow-sm">
              <pre className="overflow-x-auto text-emerald-400">
                <code>npm install @scryme/sdk</code>
              </pre>
            </div>
          </div>

          <div className="space-y-1.5 text-left">
            <span className="text-[10px] font-bold text-light-text block">Yarn:</span>
            <div className="relative group rounded-xl overflow-hidden bg-ink-bg border border-ink-border p-3.5 text-xs font-mono shadow-sm">
              <pre className="overflow-x-auto text-emerald-400">
                <code>yarn add @scryme/sdk</code>
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* Environment Variables */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-paper border-b border-ink-border pb-2 flex items-center gap-2">
          <Settings size={18} className="text-brass" />
          <span>Environment Variables Configuration</span>
        </h2>
        <p className="text-xs text-light-text leading-relaxed">
          The SDK reads specific environment variables out-of-the-box to automate its API client configurations and multi-tenant parameters.
        </p>

        <div className="border border-ink-border rounded-xl bg-ink-card/40 px-4 divide-y divide-ink-border/50">
          <div className="py-3.5 text-sm">
            <div className="flex flex-wrap items-baseline gap-2.5">
              <span className="font-mono text-paper font-semibold text-[13px]">
                SCRYME_API_URL / NEXT_PUBLIC_API_URL
              </span>
              <span className="text-brass/90 text-[11px] font-mono font-medium">
                string
              </span>
            </div>
            <p className="text-light-text mt-1.5 text-xs leading-relaxed">
              Configures the backend endpoint root. Defaults to <code className="text-paper">https://api.scryme.tech</code> if not supplied.
            </p>
          </div>

          <div className="py-3.5 text-sm">
            <div className="flex flex-wrap items-baseline gap-2.5">
              <span className="font-mono text-paper font-semibold text-[13px]">
                SCRYME_ORG_SLUG / NEXT_PUBLIC_SCRYME_ORG_SLUG / VITE_SCRYME_ORG_SLUG
              </span>
              <span className="text-brass/90 text-[11px] font-mono font-medium">
                string
              </span>
            </div>
            <p className="text-light-text mt-1.5 text-xs leading-relaxed">
              The active organization's slug. The Proxy wrapper intercepts all V3 calls and automatically resolves and injects this slug if omitted from SDK method invocations!
            </p>
          </div>

          <div className="py-3.5 text-sm">
            <div className="flex flex-wrap items-baseline gap-2.5">
              <span className="font-mono text-paper font-semibold text-[13px]">
                SCRYME_CLIENT_ID / SCRYME_CLIENT_SECRET
              </span>
              <span className="text-brass/90 text-[11px] font-mono font-medium">
                string
              </span>
            </div>
            <p className="text-light-text mt-1.5 text-xs leading-relaxed">
              Secure OAuth2 credentials used for automated token exchange flow.
            </p>
          </div>
        </div>
      </div>

      {/* Initialization & Authorization flow */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-paper border-b border-ink-border pb-2 flex items-center gap-2">
          <Key size={18} className="text-brass" />
          <span>SDK Initialization & Token Flow</span>
        </h2>
        <p className="text-xs text-light-text leading-relaxed">
          To initiate connection with the Scryme V3 API and request a secure access token, configure your client using the monorepo's <code className="text-paper">getScrymeV3API</code> client factory:
        </p>

        <div className="space-y-2 text-left">
          <span className="text-[10px] font-bold text-light-text block">COMPLETE INITIALIZATION EXAMPLE:</span>
          <div className="relative group rounded-xl overflow-hidden bg-ink-bg border border-ink-border p-4 text-xs font-mono shadow-xl">
            <pre className="overflow-x-auto text-purple-300 whitespace-pre leading-relaxed scrollbar-thin">
              <code>
                {renderHighlightedCode(
`import { getScrymeV3API } from "@scryme/sdk";
import axios from "axios";

// 1. Initialize the API instance (optionally passing a custom Axios instance)
const apiBaseUrl = process.env.SCRYME_API_URL || "https://api.scryme.tech";
axios.defaults.baseURL = apiBaseUrl;

const scryme = getScrymeV3API(axios);

async function runFlow() {
  try {
    // 2. Perform Client Credentials flow to retrieve access token
    const tokenResponse = await scryme.authExchangeToken({
      clientId: process.env.SCRYME_CLIENT_ID || "your_id",
      clientSecret: process.env.SCRYME_CLIENT_SECRET || "your_secret"
    });

    const accessToken = tokenResponse.data.accessToken;
    console.log("Successfully logged in! Token retrieved.");

    // 3. Register the token in the Axios headers
    axios.defaults.headers.common["Authorization"] = \`Bearer \${accessToken}\`;

    // 4. Perform type-safe V3 operations (orgSlug is auto-injected from environment!)
    const products = await scryme.catalogGetProducts({ limit: 10 });
    console.log("Catalog Products:", products.data);
  } catch (error) {
    console.error("SDK execution failed:", error);
  }
}`,
                  "node"
                )}
              </code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
