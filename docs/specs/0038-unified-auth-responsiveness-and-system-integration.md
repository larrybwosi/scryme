# 0038 · Unified Auth Responsiveness and System Integration

**Status**: In Progress
**Date**: 2025-05-18
**Authorized by**: User, during /develop

## Overview
The authentication application located under `apps/auth` provides the unified identity and access management gateway for all enterprise workspaces across the Scryme ecosystem. This includes web applications (`apps/web`, `apps/admin`, `apps/projects`, `apps/crm`, `apps/pos`, `apps/bakery`, `apps/site-next`) and native mobile applications (`apps/android`).

This specification formalizes three core architectural requirements:
1. Strict alignment with the enterprise design system corner geometry (`--radius: 0px`, square edges, `rounded-none`).
2. Full responsiveness across all form factors from ultra compact mobile screens (320px) to ultra wide 4K desktop viewports.
3. Unified cross system authentication orchestration, including web callback routing and mobile PKCE deep linking handshakes.

## Design System & Border Radii Alignment
In alignment with the design language established in `@repo/ui/src/globals.css`, the interface avoids rounded bubble aesthetics in favor of crisp, high density enterprise surfaces:
- Root `--radius` token is explicitly set to `0px`.
- Interactive components including primary buttons, secondary buttons, social login buttons, input fields, selects, alert callouts, compliance badges, and ledger cards use square corners (`rounded-none`).
- Visual hierarchy is established through hairline borders, precise contrast, subtle background tinting, and typography rather than rounded card silhouettes.

## Responsive Layout Specification
The authentication experience must deliver consistent ergonomics across viewports:
- **Mobile (320px to 639px)**:
  - Left authentication column occupies full screen width with fluid responsive padding (`px-4 sm:px-8 py-6`).
  - Right hero panel (`VerificationLedger`, stats, decorative brand background) is hidden to keep primary authentication actions above the virtual keyboard fold.
  - Social buttons flex responsively without text truncation.
  - Floating badges and security compliance footers wrap cleanly without horizontal scrollbars.
- **Tablet & Small Laptop (640px to 1023px)**:
  - Focused single column presentation centered with max width constraints (`max-w-md` or `max-w-lg`).
- **Desktop & Widescreen (1024px and above)**:
  - Dual column split presentation with left interactive panel (`lg:max-w-[560px] xl:max-w-[620px]`) and right high assurance security ledger panel.
  - Dynamic gradient textures and compliance credentials displayed cleanly.

## Unified Authentication & Cross System Integration
The authentication app serves as the single source of truth for identity federation:
- **Web Applications**:
  - Validates and preserves `callbackUrl` and `redirect_uri` parameters targeting authorized Scryme domains (`*.scryme.tech`) and local development ports (`http://localhost:*`).
  - Proxies authentication requests via `server.js` to upstream API services while correctly preserving multi value `Set-Cookie` session headers.
  - Supports credential sign in, Enterprise SSO (SAML 2.0 / Okta / Azure AD), FIDO2 WebAuthn Passkeys, and OAuth2 social providers (Google, GitHub).
- **Android Native Application**:
  - Exposes PKCE OAuth2 authorization at `/api/auth/oauth2/authorize` with redirect target `https://auth.scryme.tech/mobile-callback`.
  - Serves Google Digital Asset Links via `/.well-known/assetlinks.json` enabling verified Android App Links for `tech.scryme.app`.
  - Provides dual return mechanisms in `MobileCallbackPage`:
    1. Automatic Android custom URI scheme trigger `scryme://oauth/callback?code=...` with fallback delay timer.
    2. Explicit touch button "Open Scryme App" allowing users to complete login manually if browser link interception is delayed.
