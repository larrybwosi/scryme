// components/InstallationSetupGuide.tsx
import React from "react";
import { Download, Terminal, Settings, Key, BookOpen, Workflow, ShieldAlert } from "lucide-react";

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
    <div className="space-y-8 animate-fade-in">
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
        <p className="text-light-text text-xs mt-2 italic">
          For full interactive API specs and playgrounds, visit our central portal:{" "}
          <a
            href="https://docs.scryme.tech"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brass hover:underline font-semibold"
          >
            https://docs.scryme.tech
          </a>
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

      {/* Client & Server SDK Isolation */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-paper border-b border-ink-border pb-2 flex items-center gap-2">
          <Workflow size={18} className="text-brass" />
          <span>Client & Server SDK Isolation</span>
        </h2>
        <p className="text-xs text-light-text leading-relaxed">
          To prevent session/request pollution in multi-tenant contexts, the SDK supports distinct isolated setup modules for both Client-side and Server-side codebases. Initializing via class-based constructors (<code className="text-paper">ScrymeClientSDK</code> and <code className="text-paper">ScrymeServerSDK</code>) strictly requires <code className="text-paper">clientId</code>, <code className="text-paper">clientSecret</code>, and <code className="text-paper">orgSlug</code>.
        </p>

        {/* Server SDK Integration */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase">
              Server-Side (`@scryme/sdk/server`)
            </span>
          </div>
          <p className="text-xs text-light-text leading-relaxed">
            Strictly isolates Axios instances and state. Perfect for Next.js API Routes, edge functions, backend microservices, or Windmill automated workflows.
          </p>
          <div className="relative group rounded-xl overflow-hidden bg-ink-bg border border-ink-border p-4 text-xs font-mono shadow-xl">
            <pre className="overflow-x-auto text-purple-300 whitespace-pre leading-relaxed scrollbar-thin">
              <code>
                {renderHighlightedCode(
`import { ScrymeServerSDK } from "@scryme/sdk/server";

const scrymeServer = new ScrymeServerSDK({
  baseURL: "https://api.scryme.tech",
  orgSlug: "your-org-slug", // Automatic orgSlug injection on all API calls!
  clientId: "your_client_id_123",
  clientSecret: "your_client_secret_456",
});

async function run() {
  // 1. One-click initialization & authentication
  await scrymeServer.auth.authenticate();

  // 2. Call APIs without manually passing orgSlug or accessToken!
  const products = await scrymeServer.catalog.getProducts({ limit: 10 });
  console.log("Server Products:", products.data);
}`,
                  "node"
                )}
              </code>
            </pre>
          </div>
        </div>

        {/* Client SDK Integration */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2">
            <span className="bg-blue-500/10 text-blue-400 border border-blue-500/25 text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase">
              Client-Side (`@scryme/sdk/client`)
            </span>
          </div>
          <p className="text-xs text-light-text leading-relaxed">
            Provides reactive auth state persistence (<code className="text-paper">localStorage</code> / StorageProviders) with login/logout lifecycle listeners (<code className="text-paper">onAuthStateChange</code>) and automated session persistence.
          </p>
          <div className="relative group rounded-xl overflow-hidden bg-ink-bg border border-ink-border p-4 text-xs font-mono shadow-xl">
            <pre className="overflow-x-auto text-purple-300 whitespace-pre leading-relaxed scrollbar-thin">
              <code>
                {renderHighlightedCode(
`import { ScrymeClientSDK } from "@scryme/sdk/client";

const scrymeClient = new ScrymeClientSDK({
  orgSlug: "your-org-slug",
  clientId: "your_client_id_123",
  clientSecret: "your_client_secret_456",
});

// Reactively listen to auth state changes and updates
scrymeClient.auth.onAuthStateChange((event, session) => {
  console.log(\`Auth Event: \${event}\`, session);
});

async function runClient() {
  // Authentication & automatic persistence handling
  await scrymeClient.auth.authenticate();

  // Access structured domain modules directly
  const stock = await scrymeClient.inventory.getInventory({ limit: 5 });
  console.log("Client Stock:", stock.data);
}`,
                  "node"
                )}
              </code>
            </pre>
          </div>
        </div>
      </div>

      {/* Global & Legacy Orval Wrapper */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-paper border-b border-ink-border pb-2 flex items-center gap-2">
          <Key size={18} className="text-brass" />
          <span>Global / Legacy API client (`getScrymeV3API`)</span>
        </h2>
        <p className="text-xs text-light-text leading-relaxed">
          Alternatively, if you prefer utilizing a global request client or overriding behavior manually, you can initialize the custom Orval proxy with <code className="text-paper">getScrymeV3API</code>. It supports optional auto-injection of <code className="text-paper">orgSlug</code> from environment variables (<code className="text-paper">SCRYME_ORG_SLUG</code>, etc.) or custom default configurations.
        </p>

        <div className="space-y-2 text-left">
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
