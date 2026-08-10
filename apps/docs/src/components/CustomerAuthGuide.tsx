import React from "react";
import { Key, Shield, UserCheck, RefreshCw, Layers } from "lucide-react";

interface GuideProps {
  renderHighlightedCode: (code: string, language: string) => React.ReactNode;
}

export default function CustomerAuthGuide({ renderHighlightedCode }: GuideProps) {
  const registerCode = `// 1. Customer registration with credential capabilities (SDK Client-Side)
import { ScrymeClientSDK } from '@scryme/sdk/client';

const scryme = new ScrymeClientSDK({
  clientId: "your_client_id_abc", // No clientSecret needed for customer-facing client bundle!
  orgSlug: "bakery-co",
});

try {
  const result = await scryme.auth.signUp({
    name: "Alice Smith",
    email: "alice.smith@example.com",
    password: "securepassword123", // Password registration enabled!
    phone: "+254712345678"
  });
  console.log("Customer registered successfully!", result.data);
} catch (error) {
  console.error("Registration failed:", error);
}`;

  const loginCode = `// 2. Customer Secure Session Authentication
try {
  const response = await scryme.auth.signIn({
    email: "alice.smith@example.com",
    password: "securepassword123",
  });

  // The client SDK automatically persists the session and attaches the returned Bearer JWT token
  // to subsequent requests automatically under the hood!
  console.log("Login session established:", response.data);
} catch (error) {
  console.error("Sign-in failed:", error);
}`;

  const sessionCode = `// 3. Multi-Session Management APIs
try {
  // Retrieve all active sessions across multiple browsers/devices
  const sessions = await scryme.auth.getSessions();
  console.log("Active customer sessions list:", sessions);

  // Revoke a specific stale session by ID
  await scryme.auth.revokeSession("sess_abc987654");

  // Revoke all other active sessions (keeping current session alive)
  await scryme.auth.revokeAllSessions("other");
} catch (error) {
  console.error("Session management failed:", error);
}`;

  const onBehalfCode = `// 4. API Client connected app register on behalf of customer (SDK Server-Side)
import { ScrymeServerSDK } from '@scryme/sdk/server';

const scrymeServer = new ScrymeServerSDK({
  clientId: "connected_app_client_id",
  clientSecret: "connected_app_client_secret",
  orgSlug: "bakery-co"
});

// Server-side registration automatically links the customer with ExternalMapping provider tag!
const result = await scrymeServer.auth.signUp({
  name: "Corporate Partner Client",
  email: "partner@corporate.com",
  customerType: "B2B_PREMIUM"
});`;

  return (
    <div className="space-y-8 max-w-4xl text-left">
      <div className="space-y-3">
        <div className="flex items-center gap-1.5 text-[11px] text-light-text/70 font-medium">
          <span>Guides</span>
          <span className="text-brass">/</span>
          <span className="text-paper">Customer registration & session management</span>
        </div>
        <h1 className="text-[28px] font-bold text-paper leading-[1.15] tracking-tight">
          Customer Authentication & Session Management
        </h1>
        <p className="text-light-text text-[14px] leading-relaxed">
          Provide connected applications, client-facing e-commerce storefronts, and third-party integrations with first-class APIs for secure customer sign-ups, credential authentications, and deep session management features.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-ink-card/50 border border-ink-border p-4 rounded-xl space-y-2">
          <div className="text-brass flex items-center gap-2 font-bold text-xs uppercase tracking-wide">
            <UserCheck size={14} />
            <span>Secure Credentials</span>
          </div>
          <p className="text-light-text text-xs leading-relaxed">
            Register and authenticate customers directly using classic passwords or integrate effortlessly with Zitadel OIDC identities.
          </p>
        </div>
        <div className="bg-ink-card/50 border border-ink-border p-4 rounded-xl space-y-2">
          <div className="text-brass flex items-center gap-2 font-bold text-xs uppercase tracking-wide">
            <Layers size={14} />
            <span>Multi-Session Controls</span>
          </div>
          <p className="text-light-text text-xs leading-relaxed">
            Track and manage multiple active browser/device sessions for each customer with programmatic single or bulk revocation support.
          </p>
        </div>
        <div className="bg-ink-card/50 border border-ink-border p-4 rounded-xl space-y-2">
          <div className="text-brass flex items-center gap-2 font-bold text-xs uppercase tracking-wide">
            <Shield size={14} />
            <span>App-Level Actions</span>
          </div>
          <p className="text-light-text text-xs leading-relaxed">
            Allow connected apps to register customers "on behalf of" users, automatically provisioning enterprise ERP mappings behind the scenes.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-bold text-paper border-b border-ink-border pb-2">
          1. Public Customer Registration
        </h2>
        <p className="text-light-text text-sm leading-relaxed">
          Storefront websites and customer applications initialized using `ScrymeClientSDK` can trigger registration without leaking client secrets. Passwords are securely hashed and stored to instantiate classic local credentials.
        </p>
        <div className="relative group bg-ink-bg p-4 rounded-xl border border-ink-border text-xs font-mono">
          {renderHighlightedCode(registerCode, "node")}
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-bold text-paper border-b border-ink-border pb-2">
          2. Customer Login and Token Flow
        </h2>
        <p className="text-light-text text-sm leading-relaxed">
          The customer signs in using email & password. Upon successful validation, the backend generates an active session and signs a standard `HS256` Bearer JWT containing the customer identity details and unique session context.
        </p>
        <div className="relative group bg-ink-bg p-4 rounded-xl border border-ink-border text-xs font-mono">
          {renderHighlightedCode(loginCode, "node")}
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-bold text-paper border-b border-ink-border pb-2">
          3. Tracking and Revoking Sessions
        </h2>
        <p className="text-light-text text-sm leading-relaxed">
          Developers can easily list active sessions, fetch metadata such as browser user-agents or IP addresses, and programmatically invalidate one, other, or all active customer sessions instantly.
        </p>
        <div className="relative group bg-ink-bg p-4 rounded-xl border border-ink-border text-xs font-mono">
          {renderHighlightedCode(sessionCode, "node")}
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-bold text-paper border-b border-ink-border pb-2">
          4. Registration "On Behalf Of" Connected Apps
        </h2>
        <p className="text-light-text text-sm leading-relaxed">
          Server-side environments authenticated as api clients can register customers on behalf of connected apps. The system tags the customer with `API_CREATED` and dynamically links them using `ExternalMapping` matching the connected app's integration.
        </p>
        <div className="relative group bg-ink-bg p-4 rounded-xl border border-ink-border text-xs font-mono">
          {renderHighlightedCode(onBehalfCode, "node")}
        </div>
      </div>
    </div>
  );
}
