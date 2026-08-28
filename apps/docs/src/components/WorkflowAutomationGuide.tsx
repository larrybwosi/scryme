import React, { useState } from "react";
import {
  Workflow,
  Zap,
  ShieldAlert,
  Terminal,
  CheckCircle2,
  Copy,
  Check,
  Play,
  Layers,
  Settings,
  RefreshCw,
  Lock,
} from "lucide-react";

interface WorkflowAutomationGuideProps {
  renderHighlightedCode: (code: string, language: string) => React.ReactNode;
}

export default function WorkflowAutomationGuide({
  renderHighlightedCode,
}: WorkflowAutomationGuideProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const provisioningCodeNode = `// Node.js SDK / API Provisioning Example
import { ScrymeServerSDK } from '@scryme/sdk/server';

const scrymeServer = new ScrymeServerSDK({
  baseURL: "https://api.scryme.tech",
  orgSlug: "bakery-co",
  clientId: "your_client_id",
  clientSecret: "your_client_secret",
});

// Provision built-in workflow definitions with org-specific configurations
const provisioned = await fetch("https://api.scryme.tech/v3/automation/definitions/provision", {
  method: "POST",
  headers: {
    "Authorization": "Bearer <YOUR_ACCESS_TOKEN>",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    customConfigs: {
      lowstock_alert: { threshold: 15, notificationEmail: "supply@bakeryco.com" },
      customer_onboarding: { sendWelcomeEmail: true, crmFolder: "VIP Onboarding" },
    },
  }),
});

const data = await provisioned.json();
console.log("Provisioned Workflows:", data);`;

  const triggerCodeCurl = `curl -X POST "https://api.scryme.tech/v3/automation/trigger" \\
  -H "Authorization: Bearer <YOUR_ACCESS_TOKEN>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "key": "lowstock_alert",
    "payload": {
      "productId": "prod_organic_flour_50kg",
      "currentStock": 4,
      "threshold": 15
    },
    "correlationId": "corr_ord_9921_stock"
  }'`;

  const webhookSignatureCodePython = `# Python Incoming Webhook Verification
import hmac
import hashlib

def verify_webhook_signature(secret: str, raw_body: str, signature_header: str) -> bool:
    clean_sig = signature_header.replace("sha256=", "")
    expected = hmac.new(
        secret.encode("utf-8"),
        raw_body.encode("utf-8"),
        hashlib.sha256
    ).hexdigest()

    # Timing-safe comparison to prevent side-channel leaks
    return hmac.compare_digest(expected, clean_sig)`;

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brass/10 border border-brass/25 text-brass text-xs font-mono font-semibold">
          <Workflow size={13} />
          <span>Workflow & Automation Engine</span>
        </div>
        <h1 className="text-3xl font-bold text-paper tracking-tight">
          Enterprise Workflow Automation & Event Dispatch
        </h1>
        <p className="text-light-text text-sm leading-relaxed max-w-3xl">
          The Scryme Workflow Engine provides high-throughput, PostgreSQL-backed asynchronous execution, optimistic concurrency locking, exponential backoff retries, and SSRF-shielded webhooks tailored for multi-tenant enterprise operations.
        </p>
      </div>

      {/* Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-ink-card border border-ink-border p-4 rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-brass font-bold text-xs uppercase tracking-wider font-mono">
            <Zap size={14} />
            <span>Scale & Concurrency</span>
          </div>
          <p className="text-light-text text-xs leading-relaxed">
            Worker processes claim queued jobs using atomic optimistic locking, preventing duplicate executions across distributed instances.
          </p>
        </div>

        <div className="bg-ink-card border border-ink-border p-4 rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider font-mono">
            <RefreshCw size={14} />
            <span>Exponential Backoff</span>
          </div>
          <p className="text-light-text text-xs leading-relaxed">
            Failed jobs automatically retry with exponential backoff delay calculations (<code className="text-paper font-mono">base * 2^(attempt-1)</code>) and log detailed audit logs.
          </p>
        </div>

        <div className="bg-ink-card border border-ink-border p-4 rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider font-mono">
            <ShieldAlert size={14} />
            <span>SSRF & HMAC Security</span>
          </div>
          <p className="text-light-text text-xs leading-relaxed">
            All outgoing webhooks are validated against private IP ranges via <code className="text-paper font-mono">isSafeUrl</code>, while incoming webhooks verify HMAC SHA-256 signatures.
          </p>
        </div>
      </div>

      {/* Built-in Workflows Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-paper flex items-center gap-2">
          <Layers size={18} className="text-brass" />
          <span>Operational Built-in Workflows</span>
        </h2>
        <div className="border border-ink-border rounded-xl bg-ink-card/50 overflow-hidden divide-y divide-ink-border">
          <div className="p-4 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-brass">lowstock_alert</span>
              <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/25 px-2 py-0.5 rounded font-mono">EVENT</span>
            </div>
            <p className="text-xs text-light-text">
              Monitors inventory stock levels per variant and dispatches alerts to procurement when quantities fall below configured thresholds.
            </p>
          </div>

          <div className="p-4 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-brass">customer_onboarding</span>
              <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/25 px-2 py-0.5 rounded font-mono">EVENT</span>
            </div>
            <p className="text-xs text-light-text">
              Provisions CRM user profiles and sends onboarding welcome emails upon new customer registration.
            </p>
          </div>

          <div className="p-4 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-brass">outgoing_webhook</span>
              <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/25 px-2 py-0.5 rounded font-mono">WEBHOOK</span>
            </div>
            <p className="text-xs text-light-text">
              Dispatches HMAC SHA-256 signed JSON payloads to external HTTP endpoints with SSRF URL safety verification.
            </p>
          </div>
        </div>
      </div>

      {/* Provisioning Code Block */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-paper uppercase tracking-wider font-mono flex items-center gap-2">
            <Settings size={15} className="text-brass" />
            <span>1. Organization Workflow Provisioning & Customization</span>
          </h2>
        </div>
        <div className="relative group bg-ink-bg border border-ink-border rounded-xl p-4 text-xs font-mono">
          <button
            onClick={() => handleCopy(provisioningCodeNode, "code-prov")}
            className="absolute right-3 top-3 p-1.5 rounded-lg bg-ink-card text-light-text hover:text-paper border border-ink-border transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
          >
            {copiedId === "code-prov" ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
          </button>
          <pre className="overflow-x-auto text-paper whitespace-pre leading-relaxed scrollbar-thin">
            <code>{renderHighlightedCode(provisioningCodeNode, "node")}</code>
          </pre>
        </div>
      </div>

      {/* Triggering Workflows Block */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-paper uppercase tracking-wider font-mono flex items-center gap-2">
            <Play size={15} className="text-brass" />
            <span>2. Asynchronous Event Execution Trigger</span>
          </h2>
        </div>
        <div className="relative group bg-ink-bg border border-ink-border rounded-xl p-4 text-xs font-mono">
          <button
            onClick={() => handleCopy(triggerCodeCurl, "code-trig")}
            className="absolute right-3 top-3 p-1.5 rounded-lg bg-ink-card text-light-text hover:text-paper border border-ink-border transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
          >
            {copiedId === "code-trig" ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
          </button>
          <pre className="overflow-x-auto text-paper whitespace-pre leading-relaxed scrollbar-thin">
            <code>{renderHighlightedCode(triggerCodeCurl, "curl")}</code>
          </pre>
        </div>
      </div>

      {/* Incoming Webhook Signature Verification Block */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-paper uppercase tracking-wider font-mono flex items-center gap-2">
            <Lock size={15} className="text-brass" />
            <span>3. Incoming Webhook Verification</span>
          </h2>
        </div>
        <div className="relative group bg-ink-bg border border-ink-border rounded-xl p-4 text-xs font-mono">
          <button
            onClick={() => handleCopy(webhookSignatureCodePython, "code-py")}
            className="absolute right-3 top-3 p-1.5 rounded-lg bg-ink-card text-light-text hover:text-paper border border-ink-border transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
          >
            {copiedId === "code-py" ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
          </button>
          <pre className="overflow-x-auto text-paper whitespace-pre leading-relaxed scrollbar-thin">
            <code>{renderHighlightedCode(webhookSignatureCodePython, "python")}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
