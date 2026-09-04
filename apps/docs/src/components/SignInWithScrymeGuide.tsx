import React, { useState } from "react";
import { Key, Shield, CheckCircle, Code, Copy, Check, ExternalLink, ArrowRight, Server, Globe, UserCheck } from "lucide-react";

interface Props {
  renderHighlightedCode: (code: string, language: string) => React.ReactNode;
}

export default function SignInWithScrymeGuide({ renderHighlightedCode }: Props) {
  const [copiedMap, setCopiedMap] = useState<Record<string, boolean>>({});

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMap((prev) => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setCopiedMap((prev) => ({ ...prev, [id]: false }));
    }, 2000);
  };

  const codeExamples = {
    clientRegistration: `curl -X POST "https://api.scryme.tech/v3/auth/oauth/clients" \\
  -H "Authorization: Bearer <YOUR_ACCESS_TOKEN>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "My Third-Party App",
    "redirectUris": ["https://myapp.com/api/auth/callback"],
    "icon": "https://myapp.com/logo.png",
    "uri": "https://myapp.com",
    "public": false,
    "skipConsent": false
  }'`,

    authorizeUrl: `https://app.scryme.tech/oauth/authorize?` +
      `client_id=scryme_9a8b7c6d5e4f3a2b&` +
      `redirect_uri=https%3A%2F%2Fmyapp.com%2Fapi%2Fauth%2Fcallback&` +
      `response_type=code&` +
      `scope=openid+profile+email+org_info+membership&` +
      `state=xyz123`,

    tokenExchange: `curl -X POST "https://api.scryme.tech/v3/auth/oauth2/token" \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  -d "grant_type=authorization_code" \\
  -d "client_id=scryme_9a8b7c6d5e4f3a2b" \\
  -d "client_secret=sec_1a2b3c4d5e6f7g8h9i0j" \\
  -d "redirect_uri=https://myapp.com/api/auth/callback" \\
  -d "code=AUTHORIZATION_CODE_RECEIVED"`,

    userInfo: `curl -X GET "https://api.scryme.tech/v3/auth/oauth2/userinfo" \\
  -H "Authorization: Bearer <ACCESS_TOKEN>"`,

    userInfoResponse: `{
  "sub": "usr_cuid123456789",
  "name": "Alex Mercer",
  "email": "alex.mercer@merchant.com",
  "email_verified": true,
  "username": "alexm",
  "organizations": [
    {
      "id": "org_bakery_co",
      "name": "The French Bakery Co.",
      "slug": "bakery-co",
      "logo": "https://cdn.scryme.tech/logos/bakery.png"
    }
  ],
  "memberships": [
    {
      "organizationId": "org_bakery_co",
      "memberId": "mem_99812",
      "role": "OWNER"
    }
  ]
}`
  };

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Header */}
      <div className="space-y-3 border-b border-ink-border/60 pb-8">
        <div className="flex items-center gap-2 text-xs font-semibold text-brass">
          <Shield size={14} />
          <span>OAuth 2.0 & OpenID Connect Framework</span>
        </div>
        <h1 className="text-3xl font-extrabold text-paper tracking-tight">
          Sign in with Scryme Integration Guide
        </h1>
        <p className="text-light-text text-sm leading-relaxed max-w-3xl">
          Empower external web and mobile applications to seamlessly authenticate users using their Scryme identity. Standardized on OAuth 2.0 authorization code flow with OpenID Connect (OIDC) scope claims.
        </p>
      </div>

      {/* Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-ink-card/60 border border-ink-border rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-brass font-bold text-xs">
            <Key size={14} />
            <span>OAuth 2.0 & PKCE</span>
          </div>
          <p className="text-xs text-light-text leading-relaxed">
            Full support for confidential web applications (Client Secret) and public SPA/mobile apps (PKCE).
          </p>
        </div>
        <div className="bg-ink-card/60 border border-ink-border rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-brass font-bold text-xs">
            <UserCheck size={14} />
            <span>Multi-Tenant Claims</span>
          </div>
          <p className="text-xs text-light-text leading-relaxed">
            Access unified user profile data along with organization memberships and role scopes.
          </p>
        </div>
        <div className="bg-ink-card/60 border border-ink-border rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-brass font-bold text-xs">
            <Globe size={14} />
            <span>Standard Discovery</span>
          </div>
          <p className="text-xs text-light-text leading-relaxed">
            Compatible with any standard OAuth2/OIDC library via standard <code className="text-paper">.well-known</code> configuration endpoints.
          </p>
        </div>
      </div>

      {/* Step 1: Register Application */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-brass/20 text-brass flex items-center justify-center font-mono font-bold text-xs">
            1
          </div>
          <h2 className="text-lg font-bold text-paper">Register Your OAuth Client Application</h2>
        </div>
        <p className="text-xs text-light-text leading-relaxed pl-10">
          Before your application can request user sign-in, register your application credentials via the V3 API endpoint <code className="text-paper">/v3/auth/oauth/clients</code> to obtain your unique <code className="text-paper">clientId</code> and <code className="text-paper">clientSecret</code>.
        </p>

        <div className="pl-10 relative group rounded-xl overflow-hidden bg-ink-bg border border-ink-border p-4 text-xs font-mono">
          <button
            onClick={() => handleCopy(codeExamples.clientRegistration, "reg")}
            className="absolute right-3 top-3 p-1.5 rounded-lg bg-ink-card text-light-text hover:text-paper border border-ink-border transition-colors opacity-0 group-hover:opacity-100"
          >
            {copiedMap["reg"] ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
          </button>
          <pre className="overflow-x-auto text-paper whitespace-pre leading-relaxed">
            <code>{renderHighlightedCode(codeExamples.clientRegistration, "curl")}</code>
          </pre>
        </div>
      </div>

      {/* Step 2: Redirect User for Authorization */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-brass/20 text-brass flex items-center justify-center font-mono font-bold text-xs">
            2
          </div>
          <h2 className="text-lg font-bold text-paper">Redirect User to the Scryme Consent Screen</h2>
        </div>
        <p className="text-xs text-light-text leading-relaxed pl-10">
          Redirect users to the Scryme OAuth authorization URL. Users will log in to Scryme and review requested permission scopes.
        </p>

        <div className="pl-10 space-y-3">
          <div className="bg-ink-card/40 border border-ink-border p-4 rounded-xl relative group font-mono text-xs">
            <button
              onClick={() => handleCopy(codeExamples.authorizeUrl, "authurl")}
              className="absolute right-3 top-3 p-1.5 rounded-lg bg-ink-card text-light-text hover:text-paper border border-ink-border transition-colors opacity-0 group-hover:opacity-100"
            >
              {copiedMap["authurl"] ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
            </button>
            <pre className="overflow-x-auto text-brass whitespace-pre leading-relaxed">
              <code>{codeExamples.authorizeUrl}</code>
            </pre>
          </div>

          <div className="bg-ink-card/60 border border-ink-border p-4 rounded-xl text-xs space-y-2">
            <div className="font-bold text-paper">Supported Scopes</div>
            <ul className="space-y-1 text-light-text list-disc list-inside">
              <li><code className="text-paper">openid</code> — Standard OIDC token identity subject identifier</li>
              <li><code className="text-paper">profile</code> — Access user name, profile picture, and username</li>
              <li><code className="text-paper">email</code> — Access user email address and verification status</li>
              <li><code className="text-paper">org_info</code> — Include user's associated organization names, IDs, and logos</li>
              <li><code className="text-paper">membership</code> — Include user's active organization roles and member IDs</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Step 3: Exchange Authorization Code for Tokens */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-brass/20 text-brass flex items-center justify-center font-mono font-bold text-xs">
            3
          </div>
          <h2 className="text-lg font-bold text-paper">Exchange Code for Access & ID Tokens</h2>
        </div>
        <p className="text-xs text-light-text leading-relaxed pl-10">
          After the user approves access, Scryme redirects back to your specified <code className="text-paper">redirect_uri</code> with an authorization code. Exchange this code for tokens at <code className="text-paper">/v3/auth/oauth2/token</code>.
        </p>

        <div className="pl-10 relative group rounded-xl overflow-hidden bg-ink-bg border border-ink-border p-4 text-xs font-mono">
          <button
            onClick={() => handleCopy(codeExamples.tokenExchange, "token")}
            className="absolute right-3 top-3 p-1.5 rounded-lg bg-ink-card text-light-text hover:text-paper border border-ink-border transition-colors opacity-0 group-hover:opacity-100"
          >
            {copiedMap["token"] ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
          </button>
          <pre className="overflow-x-auto text-paper whitespace-pre leading-relaxed">
            <code>{renderHighlightedCode(codeExamples.tokenExchange, "curl")}</code>
          </pre>
        </div>
      </div>

      {/* Step 4: Fetch User Info */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-brass/20 text-brass flex items-center justify-center font-mono font-bold text-xs">
            4
          </div>
          <h2 className="text-lg font-bold text-paper">Fetch Authenticated User Profile Claims</h2>
        </div>
        <p className="text-xs text-light-text leading-relaxed pl-10">
          Make a GET request to <code className="text-paper">/v3/auth/oauth2/userinfo</code> using the access token as a Bearer header to retrieve full user identity details.
        </p>

        <div className="pl-10 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative group rounded-xl overflow-hidden bg-ink-bg border border-ink-border p-4 text-xs font-mono">
            <div className="text-[10px] text-brass font-bold uppercase tracking-wider mb-2">Request</div>
            <pre className="overflow-x-auto text-paper whitespace-pre leading-relaxed">
              <code>{renderHighlightedCode(codeExamples.userInfo, "curl")}</code>
            </pre>
          </div>
          <div className="relative group rounded-xl overflow-hidden bg-ink-bg border border-ink-border p-4 text-xs font-mono">
            <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider mb-2">Response JSON</div>
            <pre className="overflow-x-auto text-emerald-300 whitespace-pre leading-relaxed max-h-64">
              <code>{renderHighlightedCode(codeExamples.userInfoResponse, "json")}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
